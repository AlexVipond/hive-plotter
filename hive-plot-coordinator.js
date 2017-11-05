/*
Accept user preferences from the Hive Plot User Interface
*/

// Declare user preference variables and set defaults
let uniqueIdentifier = 'ID',
        hivePlotAxesField = "Hive Plot Axis",
        sortData = true,
        sortField = 'TLA Weighted Coappearance Degree',
        sortOrder = 'Low -> High (A -> Z)',
        firstAxisAngle = 120,
        axisLabels = true,
        labelDistanceMultiplier = 0.25,
        multipleHivePlots = true,
        hivePlotAssignmentField = 'Last Appearance Series',
        secondHivePlotDistanceMultiplier = 1.75;

// Stable sort of the nodes array
if(sortData) {
    nodes = nodes.map(function(n,i) {n.originalIndex = i; return n;}).sort(function(a,b) {
        if(a[sortField] === b[sortField]) {
            if(a.originalIndex < b.originalIndex) {
                return -1;
            } else {
                return 1;
            }
        } else if(sortOrder === 'Low -> High (A -> Z)') {
            if(a[sortField] < b[sortField]) {
                return -1;
            } else {
                return 1;
            }
        } else if(sortOrder === 'High -> Low (Z -> A)'){
            if(a[sortField] < b[sortField]) {
                return 1;
            } else {
                return -1;
            }
        }
    });
}


/*
Calculate Axis Angles and Standard Hive Plot Increments, and Group Nodes by Axis
*/

// Define key trigonemtric functions
const myRadians = function(degrees) {
    return degrees * Math.PI / 180;
} // Convert degrees to radians
const myDegrees = function(radians) {
    return radians * 180 / Math.PI;
} // Convert radians to degrees
const decimalRound = function(value, factor) {
    return Math.round(value * Math.pow(10, factor)) / Math.pow(10, factor);
} // Round to a certain number of decimals

// Create sorted arrays of unique hive plot axis and hive plot assignment values. Default sorting is alphabetical.
let hivePlotAxes = [...new Set(nodes.map(n => n[hivePlotAxesField]))].sort();
let hivePlotAssignments = [...new Set(nodes.map(n => n[hivePlotAssignmentField]))].sort();

// For each Hive Plot Axis, create an object and add Standard Hive Plot x Increment, Standard Hive Plot y Increment, Angular Coordinate, and node groups as key-value pairs.
let hivePlotAxesObjects = hivePlotAxes.map(function(h,i,a) {
    h = new Object();
    h.hivePlotAxis = a[i]; // Name of Hive Plot Axis

    h.standardXIncrement = decimalRound(Math.cos(myRadians(firstAxisAngle - i / a.length * 360)), 15); // Horizontal distance travelled from one node to the next
    h.standardYIncrement = decimalRound(Math.sin(myRadians(firstAxisAngle - i / a.length * 360)), 15); // Vertical distance travelled from one node to the next

    if(h.standardXIncrement > 0) {
        if(h.standardYIncrement > 0) {
            h.angularCoordinate = decimalRound(myDegrees(Math.atan(h.standardYIncrement / h.standardXIncrement)), 2);
        } else {
            h.angularCoordinate = 360 + decimalRound(myDegrees(Math.atan(h.standardYIncrement / h.standardXIncrement)), 2);
        }
    } else if(h.standardXIncrement < 0) {
        h.angularCoordinate = 180 + decimalRound(myDegrees(Math.atan(h.standardYIncrement / h.standardXIncrement)), 2);
    } else if(h.standardYIncrement > 0) {
        h.angularCoordinate = 90;
    } else {
        h.angularCoordinate = 270;
    } // Calculate angle at which the axis will point

    h.groupedNodes = nodes.filter(f => f[hivePlotAxesField] === h.hivePlotAxis).map(n => n[uniqueIdentifier]); // Group nodes by hive plot axis

    if(multipleHivePlots) {
        h[hivePlotAssignments[0] + " groupedNodes"] = nodes.filter(f => f[hivePlotAxesField] === h.hivePlotAxis && f[hivePlotAssignmentField] === hivePlotAssignments[0]).map(n => n[uniqueIdentifier]); // Group nodes from the current axis and the first hive plot
        h[hivePlotAssignments[1] + " groupedNodes"] = nodes.filter(f => f[hivePlotAxesField] === h.hivePlotAxis && f[hivePlotAssignmentField] === hivePlotAssignments[1]).map(n => n[uniqueIdentifier]); // Group nodes from the current axis and the second hive plot
    } // Group nodes by hive plot assignment, if appropriate

    return h;
});


/*
Calculate Standard Hive Plot Coordinates
*/

// Declare variables that will be used to calculate coordinates
let positionInCurrentGroup,
        currentXIncrement,
        currentYIncrement,
        minimumDistance,
        horizontalOffset = 0;

// For each node object, add Standard Hive Plot x Coordinates (Not Offset) as a key-value pair
nodes = nodes.map(function(n) {
    if(multipleHivePlots) {
        positionInCurrentGroup = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])][n[hivePlotAssignmentField] + " groupedNodes"].indexOf(n[uniqueIdentifier]) + 1;
    } else {
        positionInCurrentGroup = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].groupedNodes.indexOf(n[uniqueIdentifier]) + 1;
    } // Look up position of current node in appropriate node group

    currentXIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].standardXIncrement; // Look up horizontal increment

    n.standardHivePlotXCoordinateNotOffset = positionInCurrentGroup * currentXIncrement; // Calculate x coordinate, not offset horizontally for multiple hive plots

    return n;
});

// Calulate the minimum distance needed to prevent multiple hive plots from overlapping
if(multipleHivePlots) {
    if(hivePlotAxes.length > 2) {
        minimumDistance = Math.max(...nodes.filter(n => n[hivePlotAssignmentField] === hivePlotAssignments[0]).map(n => n.standardHivePlotXCoordinateNotOffset)) + Math.abs(Math.min(...nodes.filter(n => n[hivePlotAssignmentField] === hivePlotAssignments[1]).map(n => n.standardHivePlotXCoordinateNotOffset)));
    } else {
        minimumDistance = 10;
    }
}

// For each node, add Standard Hive Plot x Coordinates, Standard Hive Plot y Coordinates, Standard Hive Plot Radial Coordinates, and Hive Plot Angular Coordinates as human-readable key-value pairs
nodes.map(function(n) {
    if(multipleHivePlots) {
        positionInCurrentGroup = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])][n[hivePlotAssignmentField] + " groupedNodes"].indexOf(n[uniqueIdentifier]) + 1;
        horizontalOffset = minimumDistance * secondHivePlotDistanceMultiplier * hivePlotAssignments.indexOf(n[hivePlotAssignmentField]);
    } else {
        positionInCurrentGroup = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].groupedNodes.indexOf(n[uniqueIdentifier]) + 1;
    } // Look up position of current node in appropriate node group, and, if necessary, set horizontal offset

    currentXIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].standardXIncrement; // Look up horizontal increment
    currentYIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].standardYIncrement; // Look up vertical increment

    n["Standard Hive Plot x Coordinate"] = positionInCurrentGroup * currentXIncrement + horizontalOffset; // Calculate x coordinate. Offset horizontally if the user wants comparable, side-by-side hive plots.
    n["Standard Hive Plot y Coordinate"] = positionInCurrentGroup * currentYIncrement; // Calculate y coordinate
    n["Standard Hive Plot Radial Coordinate"] = decimalRound(Math.hypot(n.standardHivePlotXCoordinateNotOffset, n["Standard Hive Plot y Coordinate"]), 0); // Calculate radial coordinate
    n["Hive Plot Angular Coordinate"] = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].angularCoordinate; // Look up angular coordinate

    return n;
});


/*
Calculate Normalized Hive Plot Increments
*/

// For each Hive Plot Axis object, add Normalized Hive Plot x Increment and Normalized Hive Plot y Increment as key-value pairs
hivePlotAxesObjects = hivePlotAxesObjects.map(function(h) {
    h.normalizedXIncrement = Math.max(...nodes.map(n => n["Standard Hive Plot Radial Coordinate"])) / h.groupedNodes.length * h.standardXIncrement;
    h.normalizedYIncrement = Math.max(...nodes.map(n => n["Standard Hive Plot Radial Coordinate"])) / h.groupedNodes.length * h.standardYIncrement;

    if(multipleHivePlots) {
        h[hivePlotAssignments[0] + " normalizedXIncrement"] = Math.max(...nodes.map(n => n["Standard Hive Plot Radial Coordinate"])) / h[hivePlotAssignments[0] + " groupedNodes"].length * h.standardXIncrement;
        h[hivePlotAssignments[1] + " normalizedXIncrement"] = Math.max(...nodes.map(n => n["Standard Hive Plot Radial Coordinate"])) / h[hivePlotAssignments[1] + " groupedNodes"].length * h.standardXIncrement;;
        h[hivePlotAssignments[0] + " normalizedYIncrement"] = Math.max(...nodes.map(n => n["Standard Hive Plot Radial Coordinate"])) / h[hivePlotAssignments[0] + " groupedNodes"].length * h.standardYIncrement;;
        h[hivePlotAssignments[1] + " normalizedYIncrement"] = Math.max(...nodes.map(n => n["Standard Hive Plot Radial Coordinate"])) / h[hivePlotAssignments[1] + " groupedNodes"].length * h.standardYIncrement;;
    } // If user is generating multiple hive plots, calculate different increments for each plot

    return h;
});


/*
Calculate Normalized Hive Plot Coordinates
*/

// For each node object, add Normalized Hive Plot x Coordinates (Not Offset) as a key-value pair
nodes = nodes.map(function(n) {
    if(multipleHivePlots) {
        positionInCurrentGroup = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])][n[hivePlotAssignmentField] + " groupedNodes"].indexOf(n[uniqueIdentifier]) + 1;
        currentXIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])][n[hivePlotAssignmentField] + " normalizedXIncrement"];
    } else {
        positionInCurrentGroup = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].groupedNodes.indexOf(n[uniqueIdentifier]) + 1;
        currentXIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].normalizedXIncrement;
    } // Look up position of current node in appropriate node group, and look up horizontal increment

    n.normalizedHivePlotXCoordinateNotOffset = positionInCurrentGroup * currentXIncrement; // Calculate x coordinate, not offset horizontally for multiple hive plots

    return n;
});

// Calulate the minimum distance needed to prevent multiple hive plots from overlapping
if(multipleHivePlots) {
    if(hivePlotAxes.length > 2) {
        minimumDistance = Math.max(...nodes.filter(n => n[hivePlotAssignmentField] === hivePlotAssignments[0]).map(n => n.normalizedHivePlotXCoordinateNotOffset)) + Math.abs(Math.min(...nodes.filter(n => n[hivePlotAssignmentField] === hivePlotAssignments[1]).map(n => n.normalizedHivePlotXCoordinateNotOffset)));
    } else {
        minimumDistance = 10;
    }
}

// For each node, add Normalized Hive Plot x Coordinates, Normalized Hive Plot y Coordinates, and Normalized Hive Plot Radial Coordinates as human-readable key-value pairs
nodes.map(function(n) {
    if(multipleHivePlots) {
        positionInCurrentGroup = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])][n[hivePlotAssignmentField] + " groupedNodes"].indexOf(n[uniqueIdentifier]) + 1;
        horizontalOffset = minimumDistance * secondHivePlotDistanceMultiplier * hivePlotAssignments.indexOf(n[hivePlotAssignmentField]);
        currentXIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])][n[hivePlotAssignmentField] + " normalizedXIncrement"];
        currentYIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])][n[hivePlotAssignmentField] + " normalizedYIncrement"];
    } else {
        positionInCurrentGroup = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].groupedNodes.indexOf(n[uniqueIdentifier]) + 1;
        currentXIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].normalizedXIncrement;
        currentYIncrement = hivePlotAxesObjects[hivePlotAxes.indexOf(n[hivePlotAxesField])].normalizedYIncrement;
    } // Look up position of current node in appropriate node group, look up horizontal increment, and, if necessary, look up vertical increment and set horizontal offset

    n["Normalized Hive Plot x Coordinate"] = positionInCurrentGroup * currentXIncrement + horizontalOffset; // Calculate x coordinate. Offset horizontally if the user wants comparable, side-by-side hive plots.
    n["Normalized Hive Plot y Coordinate"] = positionInCurrentGroup * currentYIncrement; // Calculate y coordinate
    n["Normalized Hive Plot Radial Coordinate"] = decimalRound(Math.hypot(n.normalizedHivePlotXCoordinateNotOffset, n["Normalized Hive Plot y Coordinate"]), 15); // Calculate radial coordinate

    return n;
});


/*
Cleanup
*/

// Delete helper key-value pairs
nodes = nodes.map(function(n) {
    delete n.originalIndex;
    delete n.standardHivePlotXCoordinateNotOffset;
    delete n.normalizedHivePlotXCoordinateNotOffset;

    return n;
});


/*
Experiment with D3
*/

nodes = nodes.map(function(n) {
    n.x = hivePlotAxes.indexOf(n[hivePlotAxesField]);
    n.y = n["Standard Hive Plot Radial Coordinate"] / 10;

    return n;
})

links = links.map(function(l) {
    l.source = nodes[nodes.findIndex(f => f[uniqueIdentifier] === l["From"])];
    l.target = nodes[nodes.findIndex(f => f[uniqueIdentifier] === l["To"])];

    return l;
})

let axes = hivePlotAxes.length;

var range = axes+1;

var width = 960,
        height = 500,
        innerRadius = 40, // how far from the center an axis begins
        outerRadius = 40 + Math.max(...nodes.map(n => n["Standard Hive Plot Radial Coordinate"])); // how far an axis extends from the center

var angle = d3.scale.ordinal().domain(d3.range(range)).rangePoints([0, 2 * Math.PI]),
        radius = d3.scale.linear().range([innerRadius, outerRadius]),
        color = d3.scale.category10().domain(d3.range(20));

var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height)
    .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

svg.selectAll(".axis")
        .data(d3.range(axes))
    .enter().append("line")
        .attr("class", "axis")
        .attr("transform", function(d) { console.log((angle(d))); return "rotate(" + degrees(angle(d)) + ")"; })
        .attr("x1", radius.range()[0])
        .attr("x2", radius.range()[1]);

svg.selectAll(".link")
        .data(links)
    .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.hive.link()
        .angle(function(d) { return angle(d.x); })
        .radius(function(d) { return radius(d.y); }))
        .style("stroke", function(d) { return color(d.source.x); });

svg.selectAll(".node")
        .data(nodes)
    .enter().append("circle")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + degrees(angle(d.x)) + ")"; })
        .attr("cx", function(d) { return radius(d.y); })
        .attr("r", 5)
        .style("fill", function(d) { return color(d.x); });

//debug


/*
Object.keys(nodes[233]).forEach(function(k) {
    if(k !== "Standard Hive Plot x Coordinate" && k !== "Standard Hive Plot y Coordinate" && k !== "Standard Hive Plot Radial Coordinate" && k !== "Normalized Hive Plot x Coordinate" && k !== "Normalized Hive Plot y Coordinate" && k !== "Normalized Hive Plot Radial Coordinate" && k !== "Hive Plot Angular Coordinate" && k !== "Label") {
        delete nodes[233][k];
    }
});

Object.keys(nodes[232]).forEach(function(k) {
    if(k !== "Standard Hive Plot x Coordinate" && k !== "Standard Hive Plot y Coordinate" && k !== "Standard Hive Plot Radial Coordinate" && k !== "Normalized Hive Plot x Coordinate" && k !== "Normalized Hive Plot y Coordinate" && k !== "Normalized Hive Plot Radial Coordinate" && k !== "Hive Plot Angular Coordinate" && k !== "Label") {
        delete nodes[232][k];
    }
});

Object.keys(nodes[231]).forEach(function(k) {
    if(k !== "Standard Hive Plot x Coordinate" && k !== "Standard Hive Plot y Coordinate" && k !== "Standard Hive Plot Radial Coordinate" && k !== "Normalized Hive Plot x Coordinate" && k !== "Normalized Hive Plot y Coordinate" && k !== "Normalized Hive Plot Radial Coordinate" && k !== "Hive Plot Angular Coordinate" && k !== "Label") {
        delete nodes[231][k];
    }
});


console.log(nodes[233]);
console.log(nodes[232]);
console.log(nodes[231]);
*/
