module.exports = function(ctx, fn) {
	var curry = Array.prototype.slice.call(arguments, 2)
	return function() {
		var args = curry.concat(Array.prototype.slice.call(arguments, 0))
		fn.apply(ctx, args)
	}
}

