figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "scan-document") {
    // Define the structure for node info
    type NodeInfo = {
      id: string;
      name: string;
      type: string;
      styleId: string | symbol | undefined;
      position: { x: number; y: number };
      parentId: string | null;
    };
    

    let dsystem_nodes: NodeInfo[] = [];

    // Function to traverse through the node tree
    function traverse(node: BaseNode, insideComponent: boolean = false) {
      

      // Add this condition to exclude frames that are part of a component set
      if (node.type === "FRAME" && node.parent && node.parent.type === "COMPONENT_SET") {
        return;
      }
      

      if (node.type === "COMPONENT" || node.type === "INSTANCE") {
        insideComponent = true;
      }

      if (
        insideComponent &&
        (node.type === "INSTANCE" ||
          node.type === "TEXT" ||
          node.type === "VECTOR" ||
          node.type === "FRAME")
      ) {
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
        traverse(page as PageNode);
      }
    }

    function calculateDistances(nodes: NodeInfo[]) {
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
      console.log(
        `(${item.node1.name}, ${item.node2.name}) = ${item.distance}px.`
      );
    });

    // Send the calculated distances to the UI
    figma.ui.postMessage({ type: "distance-data", data: distances });
  } else if (msg.type === "inspect-nodes") {
    // The UI has requested to inspect some nodes
    const nodesToInspect = msg.ids.map((id: string) => figma.getNodeById(id)); // Specify id type here
    figma.viewport.scrollAndZoomIntoView(nodesToInspect);
    figma.currentPage.selection = nodesToInspect; // Select the nodes
  }
};
