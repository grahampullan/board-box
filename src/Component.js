import * as d3 from './d3-re-export.js';

class Component{
    constructor(options){
        if (!options) { options={} };
        this.margin = options.margin || {top:10, right:10, bottom:10, left:10};
        this.containerClassName = options.containerClassName || "component-area";
    }

    get width() {
        return d3.select(`#${this.parentId}`).node().clientWidth;
    }   

    get height() {
        return d3.select(`#${this.parentId}`).node().clientHeight;
    }

    get left() {
        return d3.select(`#${this.parentId}`).node().getBoundingClientRect().left;
    }

    get top() {
        return d3.select(`#${this.parentId}`).node().getBoundingClientRect().top;
    }

    get containerWidth() {
        return this.width - this.margin.left - this.margin.right;
    }

    get containerHeight() {
        return this.height - this.margin.top - this.margin.bottom;
    }

    setContainerSize() {
        const container = d3.select(`#${this.parentId}`).select(`.${this.containerClassName}`);
        container
            .style("width", `${this.containerWidth}px`)
            .style("height", `${this.containerHeight}px`)
            .style("left", `${this.margin.left}px`)
            .style("top", `${this.margin.top}px`)
            .attr("width", this.containerWidth)
            .attr("height", this.containerHeight);
    }
}

export { Component };