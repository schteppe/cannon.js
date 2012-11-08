if (typeof module !== 'undefined') {
    // export for node
    module.exports = CANNON;
} else {
    // assign to window
    this.CANNON = CANNON;
}

}).apply(this);