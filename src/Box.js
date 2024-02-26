import * as d3 from './d3-re-export.js';

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
            box.component.sharedState = this.sharedState;
            box.component.sharedStateByAncestorId = this.sharedStateByAncestorId;
            box.component.ancestorIds = this.ancestorIds;
            box.component.parentId = box.id;
        }
        this.boxes.push(box);
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

    setSizeFromPerCent() {
        const parentNode = d3.select(`#${this.parentId}`).node();
        if ( this.widthPerCent !== undefined ) {
            this.width = this.widthPerCent/100 * parentNode.clientWidth;
        }
        if ( this.heightPerCent !== undefined ) {
            this.height = this.heightPerCent/100 * parentNode.clientHeight;
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
            .style("width",`${this.width}px`)
            .style("height",`${this.height}px`)
            .style("left", `${this.position.x}px`)
            .style("top", `${this.position.y}px`); 
    }

    raiseDiv() {
        d3.select(`#${this.id}`).raise();
    }

    drag(event) {
        this.position.x = event.x;
        this.position.y = event.y;
        this.raiseDiv();
        this.setUntransformed();
        this.renderDivPosition();
    }

    leftDrag(event) {
        this.position.x = event.x;
        this.width -= event.dx;
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    rightDrag(event) {
        this.width = event.x;
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    bottomDrag(event) {
        this.height = event.y;
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    bottomLeftDrag(event) {
        this.position.x = event.x;
        this.width -= event.dx;
        this.height = event.y;
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    bottomRightDrag(event) {
        this.width = event.x;
        this.height = event.y;
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    topLeftDrag(event) {
        this.position.x = event.x;
        this.position.y = event.y;
        this.width -= event.dx;
        this.height -= event.dy;
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
    }

    topRightDrag(event) {
        this.position.y = event.y;
        this.width = event.x;
        this.height -= event.dy;
        this.raiseDiv();
        this.setUntransformed();
        this.update();
        this.updateDescendants();
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
        const parentDiv = d3.select(`#${this.parentId}`);
        this.setSizeFromPerCent();
        const div = parentDiv.append("div")
            .datum({"id":this.id})
            .attr("class", `board-box ${this.className}`)
            .attr("id", this.id)
            .style("width",`${this.width}px`)
            .style("height",`${this.height}px`)
            .style("left", `${this.position.x}px`)
            .style("top", `${this.position.y}px`)
            .style("position","absolute")
            .style("overflow","hidden")
            .call(d3.drag()
                .subject((e)=>({x: this.position.x, y: this.position.y }))
                .on("drag", boundDrag )); 

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
                .on("drag", boundLeftDrag ));

        div.append("div")
            .attr("class","board-box-right-drag")
            .style("right", "-5px")
            .style("top","10px")
            .style("width", "15px")
            .style("height", "calc(100% - 20px)")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.width, y: 0. }))
                .on("drag", boundRightDrag));

        div.append("div")
            .attr("class","board-box-bottom-drag")
            .style("left", "10px")
            .style("bottom","-5px")
            .style("width", "calc(100% - 20px)")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: 0., y: this.height  }))
                .on("drag", boundBottomDrag));

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
                .on("drag", boundBottomLeftDrag));

        div.append("div")
            .attr("class","board-box-bottom-right-drag")
            .style("right", "-5px")
            .style("bottom","-5px")
            .style("width", "15px")
            .style("height", "15px")
            .style("position","absolute")
            .call(d3.drag()
                .subject((e) => ({x: this.width, y: this.height  })) 
                .on("drag", boundBottomRightDrag));

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
                .on("drag", boundTopLeftDrag));

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
                .on("drag", boundTopRightDrag));

        if (this.component !== undefined) {
            this.component.make();
        }
        this.update();
    }

    update() {
        this.setSizeFromPerCent();
        this.renderDivPosition();
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