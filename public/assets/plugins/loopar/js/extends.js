String.prototype.hash = function () {
    var self = this, range = Array(this.length);
    for (var i = 0; i < this.length; i++) {
        range[i] = i;
    }
    return 'has' + Array.prototype.map.call(range, function (i) {
        return self.charCodeAt(i).toString(16);
    }).join('');
}

document.ready = (fn) => {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn(), 0);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
};

function clone(obj) {
    return Flatted.parse(Flatted.stringify(obj));
}
