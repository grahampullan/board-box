import * as d3 from './d3-re-export.js';

class Container {
    constructor(options) {
        this.className = options.className || "";
        this.boxes = [];
        this.containers = [];
        this.maxBox = 0;
        this.maxContainer = 0;
        this.id = options.id || "cont-0";
        this.parentId = options.parentId || "board-0";
        this.boardId = options.boardId || "board-0";
        this.context = options.context;
        this.position = options.position || {x:0, y:0};
        this.width = options.width || 200;
        this.height = options.height || 300;
        if ( options.widthPerCent !== undefined ) {
            this.setWidthFromPerCent();
        }
        if ( options.heightPerCent !== undefined ) {
            this.setHeightFromPerCent();
        }
    }

    get getNewContainerId() {
        const id = `${this.id}-cont-${this.maxContainer}`;
        this.maxContainer++;
        return id;
    }

    addContainer(container) {
        const id = this.getNewContainerId;
        container.id = id;
        container.parentId = this.id;
        container.sharedStateAnscestors = {...this.sharedStateAnscestors};
        container.sharedStateAnscestors[this.id] = this.sharedState;
        this.containers.push(container);
        return id;
    }

    get getNewBoxId() {
        const id = `${this.id}-box-${this.maxBox}`;
        this.maxBox++;
        return id;
    }

    addBox(box) {
        const id = this.getNewBoxId;
        box.id = id;
        this.boxes.push(box);
        return id;
    }

    setWidthFromPerCent() {
        const containerDiv = d3.select(`#${this.id}`);
        const parentWidth = containerDiv.parentNode.node().offsetWidth;
        this.width = parentWidth * this.widthPerCent/100;
    }

    setHeightFromPerCent() {
        const containerDiv = d3.select(`#${this.id}`);
        const parentHeight = containerDiv.parentNode.node().offsetHeight;
        this.height = parentHeight * this.HeightPerCent/100;
    }

    make() {
        const boardOffset = this.sharedStateAnscestors[this.boardId].offset;
        const parentDiv = d3.select(`#${this.parentId}`);
        const div = parentDiv.append("div")
            .attr("class", `board-container ${this.className}`)
            .attr("id", this.id)
            .style("width",`${this.width}px`)
            .style("height",`${this.height}px`)
            .style("left", `${this.position.x + boardOffset.x}px`)
            .style("top", `${this.position.y + boardOffset.y}px`)
            .style("position","absolute");   
        this.update();
    }

    update() {
        const boardOffset = this.sharedStateAnscestors[this.boardId].offset;
        const div = d3.select(`#${this.id}`);
        div
            .style("width",`${this.width}px`)
            .style("height",`${this.height}px`)
            .style("left", `${this.position.x + boardOffset.x}px`)
            .style("top", `${this.position.y + boardOffset.y}px`); 

    }

}

const containerMakeForD3Each = function( d, i ) {

    d.make();

}

const containerUpdateForD3Each = function( d, i ) {

    d.update();

}

export { Container, containerMakeForD3Each, containerUpdateForD3Each }