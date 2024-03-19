import * as d3 from './d3-re-export.js';
import { Observable } from './Observable.js';

class Box {
    constructor(options) {
        this.className = options.className || "";
        this.sharedState = {}
        this.boxes = [];
        this.maxBox = 0;
        this.id = options.id || "cont-0";
        this.parentId = options.parentId || "board-0";
        this.boardId = options.boardId || "board-0";
        this.position = options.position || {x:0, y:0};
        this.width = options.width || 200;
        this.height = options.height || 300;
        this.heightPerCent = options.heightPerCent;
        this.widthPerCent = options.widthPerCent;
        this.quantiseX = options.quantiseX || false;
        this.quantiseY = options.quantiseY || false;
        this.gridX = options.gridX;
        this.gridWidth = options.gridWidth;
        this.gridY = options.gridY;
        this.gridHeight = options.gridHeight;
        this.sharedState.gridXMax = options.gridXMax || 12;
        this.allowChildrenResizeOnBoardZoom = options.allowChildrenResizeOnBoardZoom || true;
        this.margin = options.margin || 0;
        this.autoLayout = options.autoLayout || false;
        this.boxInsertOrder = [];
        const requestAutoLayout = new Observable({flag:true, state:false});
        requestAutoLayout.subscribe(this.setAutoLayout.bind(this));
        const checkInsertOrder = new Observable({state:{pt:{x:0,y:0},id:"box-0"}});
        checkInsertOrder.subscribe(this.setInsertOrder.bind(this));
        this.sharedState = {...this.sharedState, requestAutoLayout, checkInsertOrder};
        this.component = options.component;
    }

    get getNewBoxId() {
        const id = `${this.id}-cont-${this.maxBox}`;
        this.maxBox++;
        return id;
    }

    addBox(box) {
        const id = this.getNewBoxId;
        box.id = id;
        box.parentId = this.id;
        box.untransformed = {x:box.position.x, y:box.position.y, width:box.width, height:box.height};
        box.sharedStateByAncestorId = {...this.sharedStateByAncestorId};
        box.sharedStateByAncestorId[this.id] = this.sharedState;
        box.ancestorIds = [...this.ancestorIds];
        box.ancestorIds.push(this.id);
        if (box.component !== undefined) {
            box.component.sharedState = box.sharedState;
            box.component.sharedStateByAncestorId = box.sharedStateByAncestorId;
            box.component.ancestorIds = box.ancestorIds;
            box.component.parentId = box.id;
            box.component.boardId = this.boardId;
        }
        this.boxes.push(box);
        this.boxInsertOrder.push(box.id);
        return id;
    }

    get getNewBoxId() {
        const id = `${this.id}-box-${this.maxBox}`;
        this.maxBox++;
        return id;
    }

    get getAllBoxes() {
        const allBoxes = [];
        const search = (boxes) => {
            boxes.forEach( box => {
                allBoxes.push(box);
                if (box.boxes.length !== 0) {
                    search(box.boxess);
                }
            });
        }       
        search(this.boxes);
        return allBoxes;
    }

    setSize() {
        const parentNode = d3.select(`#${this.parentId}`).node();
        const gridXMax = this.sharedStateByAncestorId[this.parentId].gridXMax;
        this.dx = parentNode.clientWidth / gridXMax;
        if ( this.widthPerCent !== undefined ) {
            this.width = this.widthPerCent/100 * parentNode.clientWidth;
        }
        if ( this.heightPerCent !== undefined ) {
            this.height = this.heightPerCent/100 * parentNode.clientHeight;
        }
        if ( this.quantiseX ) {
            this.position.x = this.gridX * this.dx;
            this.width = this.gridWidth * this.dx;
        }
        if ( this.quantiseY ) {
            this.position.y = this.gridY * this.dx;
            this.height = this.gridHeight * this.dx;
        }
    }

    setQuantise() {
        const parentNode = d3.select(`#${this.parentId}`).node();
        const gridXMax = this.sharedStateByAncestorId[this.parentId].gridXMax;
        this.dx = parentNode.clientWidth / gridXMax;
        if ( this.quantiseX ) {
            this.gridX = Math.round( this.position.x / this.dx);
            this.position.x = this.gridX * this.dx;
            this.gridWidth = Math.round( this.width / this.dx);
            this.width = this.gridWidth * this.dx;
        }
        if ( this.quantiseY ) {
            this.gridY = Math.round( this.position.y / this.dx);
            this.position.y = this.gridY * this.dx;
            this.gridHeight = Math.round( this.height / this.dx);
            this.height = this.gridHeight * this.dx;
        }
    }

    setUntransformed() {
        const t = this.sharedStateByAncestorId[this.boardId].transform;
        const u = {};
        u.width = this.width / t.k;
        u.height = this.height / t.k;
        u.x = (this.position.x - t.x ) /t.k;
        u.y = (this.position.y - t.y ) /t.k;
        this.untransformed = u;
    }

    renderDivPosition() {
        d3.select(`#${this.id}`)
            .style("width",`${this.width - 2*this.margin}px`)
            .style("height",`${this.height - 2*this.margin}px`)
            .style("left", `${this.position.x + this.margin}px`)
            .style("top", `${this.position.y + this.margin}px`); 
    }

    raiseDiv() {
        d3.select(`#${this.id}`).raise();
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
                    nextBox.position.x = insertPosition.x;
                    nextBox.position.y = insertPosition.y; 
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
        this.updateDescendants();
    }

    requestParentAutoLayout() {
        const parentSharedState = this.sharedStateByAncestorId[this.parentId];
        if ( parentSharedState.requestAutoLayout !== undefined) {
            parentSharedState.requestAutoLayout.state = true;
        }
    }

    setParentInsertOrder(data) {
        const parentSharedState = this.sharedStateByAncestorId[this.parentId];
        if ( parentSharedState.checkInsertOrder !== undefined) {
            this.sharedStateByAncestorId[this.parentId].checkInsertOrder.state = data;
        }
    }

    setInsertOrder(data) {
        const pt = data.pt;
        const id = data.id;
        let boxInsertOrder = this.boxInsertOrder;
        let found = false;
        let boxInsertOrderNew;
        this.boxes.forEach( box => {
            let xmin = box.position.x;
            let xmax = box.position.x + box.width;
            let ymin = box.position.y;
            let ymax = box.position.y + box.height;
            if ( pt.x >= xmin && pt.x <= xmax && pt.y >= ymin && pt.y <= ymax && id !== box.id ) {
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
        this.position.x = event.x;
        this.position.y = event.y;
        this.setQuantise();
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    dragEnd(event) {
        this.setParentInsertOrder({pt:{x:event.x, y:event.y}, id:this.id});
        this.requestParentAutoLayout();
    }

    leftDrag(event) {
        this.position.x = event.x;
        let dx = this.position.x - this.position0.x;
        this.width = this.width0 - dx;
        this.setQuantise();
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    rightDrag(event) {
        this.width = event.x;
        this.setQuantise();
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    bottomDrag(event) {
        this.height = event.y;
        this.setQuantise();
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    bottomLeftDrag(event) {
        this.position.x = event.x;
        let dx = this.position.x - this.position0.x;
        this.width = this.width0 - dx;
        this.height = event.y;
        this.setQuantise();
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    bottomRightDrag(event) {
        this.width = event.x;
        this.height = event.y;
        this.setQuantise();
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    topLeftDrag(event) {
        this.position.x = event.x;
        this.position.y = event.y;
        let dx = this.position.x - this.position0.x;
        this.width = this.width0 - dx;
        let dy = this.position.y - this.position0.y;
        this.height = this.height0 - dy;
        this.setQuantise();
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    topRightDrag(event) {
        this.position.y = event.y;
        this.width = event.x;
        let dy = this.position.y - this.position0.y;
        this.height = this.height0 - dy;
        this.setQuantise();
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
       // this.sharedStateByAncestorId[this.parentId].requestAutoLayout.state = true;
    }

    dragStart(event){
        this.position0 = {...this.position};
        this.width0 = this.width;
        this.height0 = this.height;
        this.raiseDiv();
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
            .style("left", `${this.position.x + this.margin}px`)
            .style("top", `${this.position.y + this.margin}px`)
            .style("position","absolute")
            .style("overflow","hidden")
            .call(d3.drag()
                .subject((e)=>({x: this.position.x, y: this.position.y }))
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
                .subject((e) => ({x: this.position.x, y: 0. }))
                .container( () => { return d3.select(`#${this.id}`).node().parentNode } ) 
                .on("start", boundDragStart )
                .on("drag", boundLeftDrag )
                .on("end", boundRequestParentAutoLayout));

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
                .on("end", boundRequestParentAutoLayout));

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
                .on("end", boundRequestParentAutoLayout));

        div.append("div")
            .attr("class","board-box-bottom-left-drag")
            .style("left", "-5px")
            .style("bottom","-5px")
            .style("width", "15px")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.position.x, y: this.height  }))
                .container( () => { return d3.select(`#${this.id}`).node().parentNode } ) 
                .on("start", boundDragStart )
                .on("drag", boundBottomLeftDrag)
                .on("end", boundRequestParentAutoLayout));

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
                .on("end", boundRequestParentAutoLayout));

        div.append("div")
            .attr("class","board-box-top-left-drag")
            .style("left", "-5px")
            .style("top","-5px")
            .style("width", "15px")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.position.x, y: this.position.y  }))
                .container( () => { return d3.select(`#${this.id}`).node().parentNode } )
                .on("start", boundDragStart ) 
                .on("drag", boundTopLeftDrag)
                .on("end", boundRequestParentAutoLayout));

        div.append("div")
            .attr("class","board-box-top-right-drag")
            .style("right", "-5px")
            .style("top","-5px")
            .style("width", "15px")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.width, y: this.position.y  }))
                .container( () => { return d3.select(`#${this.id}`).node().parentNode } ) 
                .on("start", boundDragStart )
                .on("drag", boundTopRightDrag)
                .on("end", boundRequestParentAutoLayout));

        if (this.component !== undefined) {
            this.component.make();
        }
        this.update();
    }

    update() {
        this.setSize();
        this.renderDivPosition();
        if (this.autoLayout) {
            this.setAutoLayout();
        }
        if (this.component !== undefined) {
            this.component.update();
        }
    }

    updateDescendants() {
        const div = d3.select(`#${this.id}`);
        const boxes = div.selectChildren(".board-box")
            .data(this.getAllBoxes, k => k.id);
        boxes.each(boxUpdateForD3Each);
    }

}

const boxMakeForD3Each = function( d, i ) {

    d.make();

}

const boxUpdateForD3Each = function( d, i ) {

    d.update();

}

export { Box, boxMakeForD3Each, boxUpdateForD3Each }