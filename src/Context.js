class Context {
    constructor() {
        this.boards = [];
        this.maxBoard = 0;
        this.sharedState = {};
    }

    get getNewBoardId() {
        let id = `board-${this.maxBoard}`;
        this.maxBoard++;
        return id;
    }

    addBoard(board) {
        const id = this.getNewBoardId;
        board.id = id;
        board.sharedStateAnscestors.context = this.sharedState;
        this.boards.push(board);
        return id;
    }

    getBoardById(id) {
        return this.boards.find( (board) => board.id == id );
    }

}

export {Context};