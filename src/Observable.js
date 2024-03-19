class Observable{

    constructor(options){
        if (!options) { options={} };
        this.flag = options.flag || false;
        this._state = options.state;
        this.observers=[];
        this.observerIdMax = 0;
    }

    set state(data){

        this._state = data;
        
        if( this.flag && this._state ) {
            this.observers.forEach( (observer) => {
                observer.observer();
            } );
            this._state = false;
        } else {
            this.observers.forEach( (observer) => {
                observer.observer(data);
            } );
        }

    }  

    get state(){
        return this._state;
    }

    subscribe(observer) {

        let id = this.observerIdMax;
        this.observers.push({observer,id});
        this.observerIdMax++;
        return id;

    }

    isSubscribed(observer) {

        return this.observers.map( d => d.observer).includes(observer);

    }

    isSubscribedById(id) {

        return this.observers.map( d => d.id).includes(id);

    }

    unsubscribe(observer) {

        this.observers = this.observers.filter(item => item.observer !== observer);

    }

    unsubscribeById(id) {
            
        this.observers = this.observers.filter(item => item.id !== id);
    
    }   


    setObserverFirstById(id) {

        let observer = this.observers.filter(item => item.id === id)[0];
        this.observers = this.observers.filter(item => item.id !== id);
        this.observers.unshift(observer);

    }

    setObserverLastById(id) {
            
        let observer = this.observers.filter(item => item.id === id)[0];
        this.observers = this.observers.filter(item => item.id !== id);
        this.observers.push(observer);
    
    }

}

export { Observable };