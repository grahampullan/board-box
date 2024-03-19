class Observable{

    constructor(options){
        if (!options) { options={} };
        this.flag = options.flag || false;
        this._state = options.state;
        this.observers=[];
    }

    set state(data){

        this._state = data;
        
        if( this.flag && this._state ) {
            this.observers.forEach( (observer) => {
                observer();
            } );
            this._state = false;
        } else {
            this.observers.forEach( (observer) => {
                observer(data);
            } );
        }

    }  

    get state(){
        return this._state;
    }

    subscribe(observer) {

        this.observers.push(observer);

    }

    isSubscribed(observer) {

        return this.observers.includes(observer);

    }

    unsubscribe(observer) {

        this.observers = this.observers.filter(item => item !== observer)

    }

    setObserverFirst(observer) {

        this.observers = this.observers.filter(item => item !== observer);
        this.observers.unshift(observer);

    }

    setObserverLast(observer){

        this.observers = this.observers.filter(item => item !== observer);
        this.observers.push(observer);

    }

}

export { Observable };