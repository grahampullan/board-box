class Observable{

    constructor(options){
        if (!options) { options={} };
        this.flag = options.flag || false;
        this._state = options.state;
        this.observers=[];
    }

    set state(value){

        this._state = value;
        
        if( this.flag && this._state ) {
            this.observers.forEach( (observer) => {
                console.log("calling observer");
                observer();
            } );
            this._state = false;
        } else {
            this.observers.forEach( (observer) => {
                observer();
            } );
        }

    }  

    get state(){
        return this._state;
    }

    subscribe(observer) {

        this.observers.push(observer);

    }

    unsubscribe(observer) {

        this.observers = this.observers.filter(item => item !== observer)

    }

}

export { Observable };