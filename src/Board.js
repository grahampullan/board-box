import * as d3 from './d3-re-export.js'
import {boxMakeForD3Each, boxUpdateForD3Each} from './Box.js';


class Board {
    constructor(options) {
        if (!options) { options={} };
        this.targetId = options.targetId || "target";
        this.sharedState = {};
        this.sharedStateByAncestorId = {};
        this.ancestorIds = [];
        this.sharedState.offset = {x:0, y:0};
        this.sharedState.transform = {x:0, y:0, k:1};
        this.className = options.className || "";
        this.boxes = options.boxes || [];
        this.maxBox = 0;
        this.width = options.width || 200;
        this.height = options.height || 300;
        this.heightPerCent = options.heightPerCent;
        this.widthPerCent = options.widthPerCent;
        this.sharedState.gridXMax = options.gridXMax || 12;
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
    

    get getNewBoxId() {
        const id = `${this.id}-box-${this.maxBox}`;
        this.maxBox++;
        return id;
    }

    setSize() {
        const div = d3.select(`#${this.id}`);
        const parentNode = div.node().parentNode;
        if ( this.widthPerCent !== undefined ) {
            this.width = this.widthPerCent/100 * parentNode.clientWidth;
        }
        if ( this.heightPerCent !== undefined ) {
            this.height = this.heightPerCent/100 * parentNode.clientHeight;
        }
    }

    addBox(box) {
        const id = this.getNewBoxId;
        box.id = id;
        box.boxId = id;
        box.parentId = this.id;
        box.parentBoxId = this.id;
        box.untransformed = {x:box.x, y:box.y, width:box.width, height:box.height};
        box.sharedStateByAncestorId = {...this.sharedStateByAncestorId};
        box.sharedStateByAncestorId[this.id] = this.sharedState;
        box.ancestorIds = [...this.ancestorIds];
        box.ancestorIds.push(this.id);
        const component = box.component;
        if (component !== undefined) {
            component.sharedState = box.sharedState;
            component.sharedStateByAncestorId = box.sharedStateByAncestorId;
            component.ancestorIds = box.ancestorIds;
            component.id = box.componentId;
            component.boxId = box.id;
            component.boardId = this.boardId;
        }
        this.boxes.push(box);
        return id;
    }

    make() {
        const boundZoomed = this.zoomed.bind(this);
        d3.select(`#${this.targetId}`).attr("id", this.id);
        this.setSize();
        d3.select(`#${this.id}`)
            .attr("class", `board ${this.className}`)
            .style("width",`${this.width}px`)
            .style("height",`${this.height}px`)
            .style("position","relative")
            .style("overflow","hidden");
            //.call(d3.zoom().on("zoom", boundZoomed));
        this.update();
    }

    update() {
        const div = d3.select(`#${this.id}`);
        const boxes = div.selectAll(".board-box")
            .data(this.getAllBoxes, k => k.id);
        boxes.enter().each(boxMakeForD3Each);
        boxes.exit().remove();
        boxes.each(boxUpdateForD3Each);
    }

    zoomed(event, d) {
        const t = event.transform;
        this.sharedState.transform = {x:t.x, y:t.y, k:t.k};
        this.boxes.forEach( box => {
            const u = box.untransformed;
            box.x = t.k*u.x + t.x; 
            box.y = t.k*u.y + t.y; 
            box.width = u.width * t.k;
            box.height = u.height * t.k;
            if (box.allowChildrenResizeOnBoardZoom) {
                box.boxes.forEach( childBox => {
                    const uc = childBox.untransformed;
                    childBox.x = t.k*uc.x + t.x; 
                    childBox.y = t.k*uc.y + t.y; 
                    childBox.width = uc.width * t.k;
                    childBox.height = uc.height * t.k;
                });
            }
        });
       
        const boardDiv = d3.select(`#${this.id}`);
        //    .style("background-position", `${t.x}px ${t.y}px` )
        //    .style("background-size", `${t.k*20}px ${t.k*20}px`);
        const boxes = boardDiv.selectAll(".board-box")
            .data(this.getAllBoxes, k => k.id);
        boxes.each(boxUpdateForD3Each);
    }

}

export { Board };