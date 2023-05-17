"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__, { width: 400, height: 300 });
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === "scan-document") {
        let dsystem_nodes = [];
        // Function to traverse through the node tree
        function traverse(node, insideComponent = false) {
            // Add this condition to exclude frames that are part of a component set
            if (node.type === "FRAME" && node.parent && node.parent.type === "COMPONENT_SET") {
                return;
            }
            if (node.type === "COMPONENT" || node.type === "INSTANCE") {
                insideComponent = true;
            }
            if (insideComponent &&
                (node.type === "INSTANCE" ||
                    node.type === "TEXT" ||
                    node.type === "VECTOR" ||
                    node.type === "FRAME")) {
                if (node.type === "INSTANCE" || node.fillStyleId) {
                    dsystem_nodes.push({
                        id: node.id,
                        name: node.name,
                        type: node.type,
                        styleId: node.fillStyleId,
                        position: { x: node.x, y: node.y },
                        parentId: node.parent ? node.parent.id : null
                    });
                }
            }
            if ("children" in node) {
                for (const child of node.children) {
                    traverse(child, insideComponent);
                }
            }
        }
        // Traverse through all pages
        for (const page of figma.root.children) {
            if (page.type === "PAGE") {
                traverse(page);
            }
        }
        function calculateDistances(nodes) {
            let distances = [];
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    // Only calculate distance if the nodes have the same parent
                    if (nodes[i].parentId === nodes[j].parentId) {
                        const dx = nodes[i].position.x - nodes[j].position.x;
                        const dy = nodes[i].position.y - nodes[j].position.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if ((distance % 4 === 0 || distance % 5 === 0) && distance !== 0) {
                            // Exclude distances that are 0px
                            distances.push({
                                node1: { id: nodes[i].id, name: nodes[i].name },
                                node2: { id: nodes[j].id, name: nodes[j].name },
                                distance: distance,
                            });
                        }
                    }
                }
            }
            return distances;
        }
        let distances = calculateDistances(dsystem_nodes);
        distances.forEach((item) => {
            console.log(`(${item.node1.name}, ${item.node2.name}) = ${item.distance}px.`);
        });
        // Send the calculated distances to the UI
        figma.ui.postMessage({ type: "distance-data", data: distances });
    }
    else if (msg.type === "inspect-nodes") {
        // The UI has requested to inspect some nodes
        const nodesToInspect = msg.ids.map((id) => figma.getNodeById(id)); // Specify id type here
        figma.viewport.scrollAndZoomIntoView(nodesToInspect);
        figma.currentPage.selection = nodesToInspect; // Select the nodes
    }
});
