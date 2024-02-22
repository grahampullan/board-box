import * as d3 from './d3-re-export.js'
import {boxMakeForD3Each, boxUpdateForD3Each} from './Box.js';


class Board {
    constructor(options) {
        if (!options) { options={} };
        this.targetId = options.targetId || "target";
        this.sharedState = {};
        this.sharedStateAnscestors = {};
        this.sharedState.offset = {x:0, y:0};
        this.sharedState.transform = {x:0, y:0, k:1};
        this.className = options.className || "";
        this.boxes = options.boxes || [];
        this.maxBox = 0;
        this.width = options.width || 200;
        this.height = options.height || 300;
        if ( options.widthPerCent !== undefined ) {
            this.setWidthFromPerCent();
        }
        if ( options.heightPerCent !== undefined ) {
            this.setHeightFromPerCent();
        }
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
        const id = `${this.id}-cont-${this.maxBox}`;
        this.maxBox++;
        return id;
    }

    addBox(box) {
        const id = this.getNewBoxId;
        box.id = id;
        box.untransformed = {x:box.position.x, y:box.position.y, width:box.width, height:box.height};
        box.sharedStateAnscestors = {...this.sharedStateAnscestors};
        box.sharedStateAnscestors[this.id] = this.sharedState;
        this.boxes.push(box);
        return id;
    }

    make() {
        const boundZoomed = this.zoomed.bind(this);
        d3.select(`#${this.targetId}`)
            .attr("class", `board ${this.className}`)
            .attr("id", this.id)
            .style("width",`${this.width}px`)
            .style("height",`${this.height}px`)
            .style("position","relative")
            .style("overflow","hidden")
            .call(d3.zoom().on("zoom", boundZoomed));
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
            box.position.x = t.k*u.x + t.x; 
            box.position.y = t.k*u.y + t.y; 
            box.width = u.width * t.k;
            box.height = u.height * t.k;
        });
        const boardDiv = d3.select(`#${this.id}`);
        //    .style("background-position", `${t.x}px ${t.y}px` )
        //    .style("background-size", `${t.k*20}px ${t.k*20}px`);
        const boxes = boardDiv.selectAll(".board-box")
            .data(this.getAllBoxes, k => k.id);
        boxes.each(boxUpdateForD3Each);
    }

    setWidthFromPerCent() {
        const boardDiv = d3.select(`#${this.id}`);
        const parentWidth = boardDiv.parentNode.node().offsetWidth;
        this.width = parentWidth * this.widthPerCent/100;
    }

    setHeightFromPerCent() {
        const boardDiv = d3.select(`#${this.id}`);
        const parentHeight = boardDiv.parentNode.node().offsetHeight;
        this.height = parentHeight * this.HeightPerCent/100;
    }

}

export { Board };