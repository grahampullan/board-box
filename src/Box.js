import * as d3 from './d3-re-export.js';
import { Observable } from './Observable.js';
import { collideRectCenter } from './collideRecCenter.js';

class Box {
    constructor(options) {
        this.className = options.className || "";
        this.sharedState = {}
        this.boxes = [];
        this.maxBox = 0;
        this.id = options.id || "cont-0";
        this.parentId = options.parentId || "board-0";
        this.boardId = options.boardId || "board-0";
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 200;
        this.height = options.height || 300;
        this.heightPerCent = options.heightPerCent;
        this.widthPerCent = options.widthPerCent;
        this.quantiseX = options.quantiseX || false;
        this.quantiseY = options.quantiseY || false;
        this.margin = options.margin || 0;
        this.gridX = options.gridX;
        this.gridWidth = options.gridWidth;
        this.gridY = options.gridY;
        this.gridHeight = options.gridHeight;
        this.sharedState.gridXMax = options.gridXMax || 12;
        this.allowChildrenResizeOnBoardZoom = options.allowChildrenResizeOnBoardZoom || true;
        this.autoLayout = options.autoLayout || false;
        this.autoNoOverlap = options.autoNoOverlap || false;
        this.boxInsertOrder = [];
        this.boxesSharedStateKeys = options.boxesSharedStateKeys || ["boxId"];
        this.componentMargin = options.componentMargin || {top:10, right:10, bottom:10, left:10};
        const requestAutoLayout = new Observable({flag:true, state:false});
        requestAutoLayout.subscribe(this.setAutoLayoutAndUpdate.bind(this));
        const requestAutoNoOverlap = new Observable({flag:false, state:{}});
        requestAutoNoOverlap.subscribe(this.setAutoNoOverlap.bind(this));
        const checkInsertOrder = new Observable({state:{pt:{x:0,y:0},id:"box-0"}});
        checkInsertOrder.subscribe(this.setInsertOrder.bind(this));
        const requestUpdateBoxes = new Observable({flag:false, state:{boxesToAdd:[], boxesToRemove:[]}});
        requestUpdateBoxes.subscribe(this.updateBoxes.bind(this));
        this.sharedState = {...this.sharedState, requestAutoLayout, requestAutoNoOverlap, checkInsertOrder, requestUpdateBoxes};
        this.component = options.component;
        if (this.autoNoOverlap) {
            this.createForceSimulation();
        }
        this.locationForChildBoxes = options.locationForChildBoxes;
    }

    addBox(box) {
        const id = this.getNewBoxId;
        box.id = id;
        box.boxId = id;
        if (this.locationForChildBoxes !== undefined) {
            this.parentIdForChildBoxes = `${this.boxId}-${this.locationForChildBoxes}`;
        } else {
            this.parentIdForChildBoxes = this.boxId;
        }
        box.parentId = this.parentIdForChildBoxes;
        box.parentBoxId = this.boxId;
        box.untransformed = {x:box.x, y:box.y, width:box.width, height:box.height};
        box.sharedStateByAncestorId = {...this.sharedStateByAncestorId};
        box.sharedStateByAncestorId[this.id] = this.sharedState;
        box.ancestorIds = [...this.ancestorIds];
        box.ancestorIds.push(this.boxId);
        const component = box.component;
        if (component !== undefined) {
            component.sharedState = box.sharedState;
            component.sharedStateByAncestorId = box.sharedStateByAncestorId;
            component.ancestorIds = box.ancestorIds;
            component.id = box.componentId;
            component.boxId = box.boxId;
            component.boardId = this.boardId;
        }
        this.boxes.push(box);
        this.boxInsertOrder.push(box.id);
        const boxesSharedStateKeys = this.boxesSharedStateKeys;
        const boxesSharedState = this.boxes.map(box => {
            const boxStateToShare = {};
            boxesSharedStateKeys.forEach( key => {
                if ( component !== undefined) {
                    boxStateToShare[key] = box.component[key];
                } else {
                    boxStateToShare[key] = box[key];
                }
            });
            return boxStateToShare;
        });
        this.sharedState.boxes = boxesSharedState;
        if (this.autoNoOverlap) {
            this.createForceSimulation();
        }
        return id;
    }

    removeBox(id) {
        const box = this.boxes.find( box => box.id == id );
        if ( box.component ) {
            box.component.remove();
        }
        this.boxes = this.boxes.filter( box => box.id !== id);
        this.sharedState.boxes = this.sharedState.boxes.filter( box => box.boxId !== id);
        this.boxInsertOrder = this.boxInsertOrder.filter( boxId => boxId !== id);
        d3.select(`#${id}`).remove();
    }

    updateBoxes(data) {
        const boxesToAdd = data.boxesToAdd;
        const boxesToRemove = data.boxesToRemove;
        boxesToAdd.forEach( box => {
            this.addBox(box);
        });
        boxesToRemove.forEach( boxId => {
            this.removeBox(boxId);
        });
        boxesToAdd.forEach( box => {
            box.make();
        });
        this.setAutoLayoutAndUpdate();
    }

    get getNewBoxId() {
        const id = `${this.boxId}-box-${this.maxBox}`;
        this.maxBox++;
        return id;
    }

    get componentId() {
        const id = `${this.boxId}-component`;
        return id;
    }

    get getAllBoxes() {
        const allBoxes = [];
        const search = (boxes) => {
            boxes.forEach( box => {
                allBoxes.push(box);
                if (box.boxes.length !== 0) {
                    search(box.boxes);
                }
            });
        }       
        search(this.boxes);
        return allBoxes;
    }

    setSize() {
        const parentNode = d3.select(`#${this.parentBoxId}`).node();
        const gridXMax = this.sharedStateByAncestorId[this.parentBoxId].gridXMax;
        this.dx = parentNode.clientWidth / gridXMax;
        if ( this.widthPerCent !== undefined ) {
            this.width = this.widthPerCent/100 * parentNode.clientWidth;
        }
        if ( this.heightPerCent !== undefined ) {
            this.height = this.heightPerCent/100 * parentNode.clientHeight;
        }
        if ( this.quantiseX ) {
            this.x = this.gridX * this.dx;
            this.width = this.gridWidth * this.dx;
        }
        if ( this.quantiseY ) {
            this.y = this.gridY * this.dx;
            this.height = this.gridHeight * this.dx;
        }
    }

    setQuantise() {
        const parentNode = d3.select(`#${this.parentId}`).node();
        const gridXMax = this.sharedStateByAncestorId[this.parentBoxId].gridXMax;
        this.dx = parentNode.clientWidth / gridXMax;
        if ( this.quantiseX ) {
            this.gridX = Math.round( this.x / this.dx);
            this.x = this.gridX * this.dx;
            this.gridWidth = Math.round( this.width / this.dx);
            this.width = this.gridWidth * this.dx;
        }
        if ( this.quantiseY ) {
            this.gridY = Math.round( this.y / this.dx);
            this.y = this.gridY * this.dx;
            this.gridHeight = Math.round( this.height / this.dx);
            this.height = this.gridHeight * this.dx;
        }
    }

    setUntransformed() {
        const t = this.sharedStateByAncestorId[this.boardId].transform;
        const u = {};
        u.width = this.width / t.k;
        u.height = this.height / t.k;
        u.x = (this.x - t.x ) /t.k;
        u.y = (this.y - t.y ) /t.k;
        this.untransformed = u;
    }

    renderDivPosition() {
        d3.select(`#${this.id}`)
            .style("width",`${this.width - 2*this.margin}px`)
            .style("height",`${this.height - 2*this.margin}px`)
            .style("left", `${this.x + this.margin}px`)
            .style("top", `${this.y + this.margin}px`); 
    }

    raiseDiv() {
        d3.select(`#${this.id}`).raise();
    }

    makeComponentDiv() {
        const div = d3.select(`#${this.id}`);
        div.append("div")
            .attr("id", `${this.componentId}`)
            .attr("class", "board-box-component")
            .style("width",`${this.width - this.componentMargin.left - this.componentMargin.right}px`)
            .style("height",`${this.height - this.componentMargin.top - this.componentMargin.bottom}px`)
            .style("left", `${this.componentMargin.left}px`)
            .style("top", `${this.componentMargin.top}px`)
            .style("position","absolute")
            .style("overflow","hidden")
            .style("pointer-events","none");
    }

    updateComponentDiv() {
        const div = d3.select(`#${this.id}`);
        const componentDiv = div.select(".board-box-component");
        componentDiv
            .style("width",`${this.width - this.componentMargin.left - this.componentMargin.right}px`)
            .style("height",`${this.height - this.componentMargin.top - this.componentMargin.bottom}px`)
            .style("left", `${this.componentMargin.left}px`)
            .style("top", `${this.componentMargin.top}px`);
    }


    setAutoLayout() {
        if ( !this.autoLayout ) {
            return;
        }
        let containerWidth = this.width;
        let containerHeigth = this.height;
        let iCol = 0;
        let iSubRow = 0;
        let insertPosition = {x:0, y:0};
        let rowHeight = 0;
        let rowHeightPrev;
        let rowTop = 0;
        let colWidth = 0;
        this.boxInsertOrder.forEach( nextBoxId => {
            let nextBox = this.boxes.find( d => d.id == nextBoxId );
            let nextBoxWidth = nextBox.width;
            let nextBoxHeight = nextBox.height;
            let boxInserted = false;
            let counter = 0
            while ( !boxInserted && counter < 10 ) {
                //console.log(counter);
                if ( iSubRow == 0 && iCol == 0 ) {
                    rowHeight = nextBoxHeight+1; // +1 to avoid rounding errors
                }
                if ( iSubRow == 0) {
                    rowHeightPrev = rowHeight;
                    rowHeight = Math.max(rowHeight, nextBoxHeight);
                }
                let availableWidth = containerWidth - insertPosition.x;
                let availableHeight = rowTop + rowHeight - insertPosition.y;
                let widthFits = false;
                let heightFits = false;
                //console.log({availableWidth, availableHeight, nextBoxWidth, nextBoxHeight, insertPosition,iCol, iSubRow, colWidth, rowHeight, rowTop, rowHeightPrev});
                if ( nextBoxWidth <= availableWidth && iSubRow == 0 ) {
                    widthFits = true;
                }
                if ( nextBoxWidth <= colWidth && iSubRow > 0 ) {
                    widthFits = true;
                }
                if ( nextBoxHeight <= availableHeight ) {
                    heightFits = true;
                }
                if ( iCol == 0 && iSubRow == 0) {
                    widthFits = true;
                }
                if ( widthFits && heightFits ) { // insert box
                    //console.log("inserted");
                    nextBox.x = insertPosition.x;
                    nextBox.y = insertPosition.y; 
                    insertPosition.y += nextBoxHeight;
                    colWidth = Math.max(colWidth, nextBoxWidth);
                    iSubRow++;
                    boxInserted = true;
                }
                if ( !widthFits && iSubRow == 0) { // box is too wide, start next full row
                    //console.log("too wide, start new full row");
                    if ( rowHeight == nextBoxHeight ) {
                        rowHeight = rowHeightPrev;
                    }
                    insertPosition.x = 0;
                    insertPosition.y = rowTop + rowHeight;
                    rowTop += rowHeight;
                    iCol = 0;
                    iSubRow = 0;
                }
                if ( !widthFits && iSubRow > 0) { // box is too wide for this col, start next col
                    //console.log("too wide, start new col");
                    insertPosition.x += colWidth;
                    insertPosition.y = rowTop;
                    iCol++;
                    iSubRow = 0;
                    colWidth = 0;
                }
                if ( !heightFits ) { // box is too high, start next col
                    //console.log("too high, start new col");
                    insertPosition.x += colWidth;
                    insertPosition.y = rowTop;
                    iCol++;
                    iSubRow = 0;
                    colWidth = 0;
                }
                counter++;
            }
        });
    }

    setAutoLayoutAndUpdate() {
        this.setAutoLayout();
        this.updateDescendants("normal");
    }

    createForceSimulation() {
        if ( this.simulation !== undefined ) {
            this.simulation.stop();
        }
        const width = this.width;
        const height = this.height;
        const boundUpdateDescendants = this.updateDescendants.bind(this);
        const simulation = d3.forceSimulation(this.boxes)
            //.force("center", d3.forceCenter(width/2, height/2))
            .force("manyBody", d3.forceManyBody().strength(100))
            .force("collide", collideRectCenter( d => 0.45*Math.sqrt(d.width**2 + d.height**2) ).iterations(4))
            .on("tick", function() {
                if (this.alpha() < this.alphaMin()) {
                    boundUpdateDescendants("normal")
                } else {
                    boundUpdateDescendants("layout");
                }
            })
            .alpha(1.)
            .alphaTarget(0.)
            .alphaDecay(0.1)
            .alphaMin(0.5)
            //.stop();
        this.simulation = simulation;
    }


    setAutoNoOverlap(options) {
        if ( !this.autoNoOverlap ) {
            return;
        }
        const reset = options.reset;
        const fixedId = options.fixedId;
        this.boxes.filter( box => box.id !== fixedId).forEach( box => {
            if ( box.id !== fixedId ) {
                box.fx = null;
                box.fy = null;
            }
        });
        if ( reset ) {
            this.createForceSimulation();
        } else {
            this.simulation.alpha(1).restart();
        }
    }

    requestParentAutoLayout() {
        const parentSharedState = this.sharedStateByAncestorId[this.parentBoxId];
        if ( parentSharedState.requestAutoLayout !== undefined) {
            parentSharedState.requestAutoLayout.state = true;
        }
    }

    requestParentAutoNoOverlap(reset, fixedId) {
        //this.boxes.filter( box => box.id !== fixedId).forEach( box => {
        //    box.fx = null;
        //    box.fy = null;
        //});
        const parentSharedState = this.sharedStateByAncestorId[this.parentBoxId];
        if ( parentSharedState.requestAutoNoOverlap !== undefined) {
            parentSharedState.requestAutoNoOverlap.state = {reset, fixedId};
        }
    }

    setParentInsertOrder(data) {
        const parentSharedState = this.sharedStateByAncestorId[this.parentBoxId];
        if ( parentSharedState.checkInsertOrder !== undefined) {
            this.sharedStateByAncestorId[this.parentBoxId].checkInsertOrder.state = data;
        }
    }

    setInsertOrder(data) {
        const pt = data.pt;
        const id = data.id;
        let boxInsertOrder = this.boxInsertOrder;
        let found = false;
        let boxInsertOrderNew;
        this.boxes.forEach( box => {
            let xmin = box.x + 1;
            let xmax = box.x + box.width -2;
            let ymin = box.y + 1
            let ymax = box.y + box.height -2;
            if ( pt.x > xmin && pt.x <= xmax && pt.y >= ymin && pt.y <= ymax && id !== box.id ) {
                found = true;
                let insertPointId = box.id;
                boxInsertOrderNew = boxInsertOrder.filter( boxId => boxId !== id);
                let insertIndex = boxInsertOrderNew.indexOf(insertPointId);
                boxInsertOrderNew.splice(insertIndex,0,id);
            }
        });
        if ( found ) {
            this.boxInsertOrder = boxInsertOrderNew;
        }
    }

    drag(event) {
        this.x = event.x;
        this.y = event.y;
        this.fx = event.x;
        this.fy = event.y;
        this.setQuantise();
        this.raiseDiv();
        this.update("move");
        this.updateDescendants("move");
        this.requestParentAutoNoOverlap(false, this.id);
    }

    dragEnd(event) {
        this.setParentInsertOrder({pt:{x:event.x, y:event.y}, id:this.id});
        this.requestParentAutoLayout();
        this.requestParentAutoNoOverlap(false, this.id);
    }

    leftDrag(event) {
        this.x = event.x;
        let dx = this.x - this.x0;
        this.width = this.width0 - dx;
        this.setQuantise();
        this.raiseDiv();
        this.update("normal");
        this.updateDescendants("normal");
        this.fx = this.x;
        this.fy = this.y;
        this.requestParentAutoNoOverlap(true, this.id);
    }

    rightDrag(event) {
        this.width = event.x;
        this.setQuantise();
        this.raiseDiv();
        this.update("normal");
        this.updateDescendants("normal");
        this.fx = this.x;
        this.fy = this.y;
        this.requestParentAutoNoOverlap(true, this.id);
    }

    bottomDrag(event) {
        this.height = event.y;
        this.setQuantise();
        this.raiseDiv();
        this.update("normal");
        this.updateDescendants("normal");
        this.fx = this.x;
        this.fy = this.y;
        this.requestParentAutoNoOverlap(true,this.id);
    }

    bottomLeftDrag(event) {
        this.x = event.x;
        let dx = this.x - this.x0;
        this.width = this.width0 - dx;
        this.height = event.y;
        this.setQuantise();
        this.raiseDiv();
        this.update("normal");
        this.updateDescendants("normal");
        this.fx = this.x;
        this.fy = this.y;
        this.requestParentAutoNoOverlap(true, this.id);
    }

    bottomRightDrag(event) {
        this.width = event.x;
        this.height = event.y;
        this.setQuantise();
        this.raiseDiv();
        this.update("normal");
        this.updateDescendants("normal");
        this.fx = this.x;
        this.fy = this.y;
        this.requestParentAutoNoOverlap(true, this.id);
    }

    topLeftDrag(event) {
        this.x = event.x;
        this.y = event.y;
        let dx = this.x - this.x0;
        this.width = this.width0 - dx;
        let dy = this.y - this.y0;
        this.height = this.height0 - dy;
        this.setQuantise();
        this.raiseDiv();
        this.update("normal");
        this.updateDescendants("normal");
        this.fx = this.x;
        this.fy = this.y;
        this.requestParentAutoNoOverlap(true, this.id);
    }

    topRightDrag(event) {
        this.y = event.y;
        this.width = event.x;
        let dy = this.y - this.y0;
        this.height = this.height0 - dy;
        this.setQuantise();
        this.raiseDiv();
        this.update("normal");
        this.updateDescendants("normal");
        this.fx = this.x;
        this.fy = this.y;
        this.requestParentAutoNoOverlap(true, this.id);
    }

    dragStart(event){
        this.x0 = this.x;
        this.y0 = this.y;
        this.width0 = this.width;
        this.height0 = this.height;
        this.fx = this.x;
        this.fy = this.y;
        //this.raiseDiv();
    }

    make() {
        const boundDrag = this.drag.bind(this);
        const boundLeftDrag = this.leftDrag.bind(this);
        const boundRightDrag = this.rightDrag.bind(this);
        const boundBottomDrag = this.bottomDrag.bind(this);
        const boundBottomLeftDrag = this.bottomLeftDrag.bind(this);
        const boundBottomRightDrag = this.bottomRightDrag.bind(this);
        const boundTopLeftDrag = this.topLeftDrag.bind(this);
        const boundTopRightDrag = this.topRightDrag.bind(this);
        const boundDragStart = this.dragStart.bind(this);
        const boundDragEnd = this.dragEnd.bind(this);
        const boundRequestParentAutoLayout = this.requestParentAutoLayout.bind(this);
        const parentDiv = d3.select(`#${this.parentId}`);
        this.setSize();
        const div = parentDiv.append("div")
            .datum({"id":this.id})
            .attr("class", `board-box ${this.className}`)
            .attr("id", this.id)
            .style("width",`${this.width - 2*this.margin}px`)
            .style("height",`${this.height - 2*this.margin}px`)
            .style("left", `${this.x + this.margin}px`)
            .style("top", `${this.y + this.margin}px`)
            .style("position","absolute")
            .style("overflow","hidden")
            .call(d3.drag()
                .subject((e)=>({x: this.x, y: this.y }))
                .on("start", boundDragStart )
                .on("drag", boundDrag )
                .on("end", boundDragEnd )); 

        div.append("div")
            .attr("class","board-box-left-drag")
            .style("left","-5px")
            .style("top","10px")
            .style("width", "15px")
            .style("height", "calc(100% - 20px)" )
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.x, y: 0. }))
                .container( () => { return d3.select(`#${this.id}`).node().parentNode } ) 
                .on("start", boundDragStart )
                .on("drag", boundLeftDrag )
                //.on("end", boundRequestParentAutoLayout));
                .on("end", boundDragEnd )); 

        div.append("div")
            .attr("class","board-box-right-drag")
            .style("right", "-5px")
            .style("top","10px")
            .style("width", "15px")
            .style("height", "calc(100% - 20px)")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.width, y: 0. }))
                .on("start", boundDragStart )
                .on("drag", boundRightDrag)
                //.on("end", boundRequestParentAutoLayout));
                .on("end", boundDragEnd )); 

        div.append("div")
            .attr("class","board-box-bottom-drag")
            .style("left", "10px")
            .style("bottom","-5px")
            .style("width", "calc(100% - 20px)")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: 0., y: this.height  }))
                .on("start", boundDragStart )
                .on("drag", boundBottomDrag)
                //.on("end", boundRequestParentAutoLayout));
                .on("end", boundDragEnd )); 

        div.append("div")
            .attr("class","board-box-bottom-left-drag")
            .style("left", "-5px")
            .style("bottom","-5px")
            .style("width", "15px")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.x, y: this.height  }))
                .container( () => { return d3.select(`#${this.id}`).node().parentNode } ) 
                .on("start", boundDragStart )
                .on("drag", boundBottomLeftDrag)
                //.on("end", boundRequestParentAutoLayout));
                .on("end", boundDragEnd )); 

        div.append("div")
            .attr("class","board-box-bottom-right-drag")
            .style("right", "-5px")
            .style("bottom","-5px")
            .style("width", "15px")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.width, y: this.height  }))
                .on("start", boundDragStart ) 
                .on("drag", boundBottomRightDrag)
                //.on("end", boundRequestParentAutoLayout));
                .on("end", boundDragEnd )); 

        div.append("div")
            .attr("class","board-box-top-left-drag")
            .style("left", "-5px")
            .style("top","-5px")
            .style("width", "15px")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.x, y: this.y  }))
                .container( () => { return d3.select(`#${this.id}`).node().parentNode } )
                .on("start", boundDragStart ) 
                .on("drag", boundTopLeftDrag)
                //.on("end", boundRequestParentAutoLayout));
                .on("end", boundDragEnd )); 

        div.append("div")
            .attr("class","board-box-top-right-drag")
            .style("right", "-5px")
            .style("top","-5px")
            .style("width", "15px")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.width, y: this.y  }))
                .container( () => { return d3.select(`#${this.id}`).node().parentNode } ) 
                .on("start", boundDragStart )
                .on("drag", boundTopRightDrag)
                //.on("end", boundRequestParentAutoLayout));
                .on("end", boundDragEnd )); 

        if (this.component !== undefined) {
            this.makeComponentDiv();
            this.component.updateType = "normal";
            this.component.make();
        }
        this.update("normal");
    }

    update(type="normal") {
        this.setSize();
        this.renderDivPosition();

        if (this.autoLayout) {
            this.setAutoLayout();
        }
        if (this.component !== undefined) {
            this.updateComponentDiv();
            this.component.updateType = type;
            this.component.update();
        }
        this.setUntransformed();
    }

    updateDescendants(type="normal") {
        //const div = d3.select(`#${this.id}`);
        //const boxes = div.selectChildren(".board-box")
        //    .data(this.getAllBoxes, k => k.id);
        //boxes.each(boxUpdateForD3Each);
        this.getAllBoxes.forEach( box => {
            box.update(type);
        });   
    }

}

const boxMakeForD3Each = function( d, i ) {

    d.make();

}

const boxUpdateForD3Each = function( d, i ) {

    d.update("normal");

}

export { Box, boxMakeForD3Each, boxUpdateForD3Each }