import * as d3 from './d3-re-export.js'
import {containerMakeForD3Each, containerUpdateForD3Each} from './Container.js';


/*
Board
.targetId  = the id of the div that will be the Board
.className = option to give the Board a defined class name
.containers = an Array of ALL Containers on the Board, each element is a Container
.offset = for panning the Board
.width, .height = of Board in px
.widthPerCent, .heightPerCent = of Board as fraction of parent div

.sharedState - state of this Board, will be shared with descdendents
.sharedStateAnscestors - states of anscestors

*/


class Board {
    constructor(options) {
        if (!options) { options={} };
        this.targetId = options.targetId || "target";
        this.sharedState = {};
        this.sharedStateAnscestors = {};
        this.sharedState.offset = {x:0, y:0};
        this.className = options.className || "";
        this.containers = options.containers || [];
        this.maxContainer = 0;
        this.width = options.width || 200;
        this.height = options.height || 300;
        if ( options.widthPerCent !== undefined ) {
            this.setWidthFromPerCent();
        }
        if ( options.heightPerCent !== undefined ) {
            this.setHeightFromPerCent();
        }
    }

    get getAllContainers() {
        const allContainers = [];
        const search = (containers) => {
            containers.forEach( container => {
                allContainers.push(container);
                if (container.containers.length !== 0) {
                    search(container.containers);
                }
            });
        }       
        search(this.containers);
        return allContainers;
    }
    

    get getNewContainerId() {
        const id = `${this.id}-cont-${this.maxContainer}`;
        this.maxContainer++;
        return id;
    }

    addContainer(container) {
        const id = this.getNewContainerId;
        container.id = id;
        container.sharedStateAnscestors = {...this.sharedStateAnscestors};
        container.sharedStateAnscestors[this.id] = this.sharedState;
        this.containers.push(container);
        return id;
    }

    make() {
        const boundBoardDragged = this.boardDragged.bind(this);
        d3.select(`#${this.targetId}`)
            .attr("class", `board ${this.className}`)
            .attr("id", this.id)
            .datum(this.sharedState.offset)
            .style("width",`${this.width}px`)
            .style("height",`${this.height}px`)
            .style("position","relative")
            .style("overflow","hidden")
            .call(d3.drag().on("drag", boundBoardDragged));
        this.update();
    }

    update() {
        const div = d3.select(`#${this.id}`);
        //
        // update all containers
        //
        console.log(this.getAllContainers);
        const containers = div.selectAll(".board-container")
            .data(this.getAllContainers, k => k.id);
        containers.enter().each(containerMakeForD3Each);
        containers.exit().remove();
        containers.each(containerUpdateForD3Each);
        //
        // update all boxes
        //
        //const allContainers = div.selectAll(".board-container")
        //    .data(this.containers);
        //const boxes = allContainers.selectAll(".box")
        //    .data(d => d.boxes.filter( box => box.type=="box") );
        //boxes.enter().each(boxMakeForD3Each);
        //boxes.exit().each(boxRemoveForD3Each);
        //boxes.each(boxUpdateForD3Each);
    }

    boardDragged(event, d) {
        d.x = event.x;
        d.y = event.y;
        const boardDiv = d3.select(`#${this.id}`);
        boardDiv.style("background-position", `${d.x}px ${d.y}px` )
        const containers = boardDiv.selectAll(".board-container")
            .data(this.containers);
        containers.each(containerUpdateForD3Each);
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