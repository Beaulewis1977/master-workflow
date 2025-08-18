// Test file to trigger Claude Code review
function calculateSum(a, b) {
    // This could be improved
    var result = a + b;
    console.log("Sum is: " + result);
    return result;
}

// Intentionally suboptimal code for testing
function findMax(arr) {
    let max = arr[0];
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

module.exports = { calculateSum, findMax };