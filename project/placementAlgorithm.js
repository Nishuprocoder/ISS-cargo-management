const placeItems = (items, containers) => {
    const placements = [];
    const containerMap = new Map(containers.map(c => [c.containerId, { ...c, items: [] }]));

    for (const item of items.sort((a, b) => b.priority - a.priority)) {
        let placed = false;
        for (const [containerId, container] of containerMap) {
            if (item.preferredZone === container.zone || !item.preferredZone) {
                const itemVolume = item.width * item.depth * item.height;
                const containerVolume = container.width * container.depth * container.height;
                const usedVolume = container.usedVolume || 0;

                if (usedVolume + itemVolume <= containerVolume) {
                    container.usedVolume = usedVolume + itemVolume;
                    container.items.push(item.itemId);
                    placements.push({
                        itemId: item.itemId,
                        containerId,
                        position: {
                            startCoordinates: { width: 0, depth: 0, height: 0 }, // Simplified; real 3D packing would be complex
                            endCoordinates: { width: item.width, depth: item.depth, height: item.height }
                        }
                    });
                    placed = true;
                    break;
                }
            }
        }
        if (!placed) throw new Error(`No space for item ${item.itemId}`);
    }

    return { placements, updatedContainers: Array.from(containerMap.values()) };
};

module.exports = { placeItems };