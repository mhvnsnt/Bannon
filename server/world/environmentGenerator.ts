export interface GeoNode {
    id: number;
    lat: number;
    lon: number;
}

export interface GameSplinePath {
    wayId: number;
    highwayType: string;
    nodes: GeoNode[];
}

export const fetchRealWorldRoads = async (
    southLat: number, westLon: number, 
    northLat: number, eastLon: number
): Promise<GameSplinePath[]> => {
    const url = "https://overpass-api.de/api/interpreter";
    const query = `
    [out:json];
    (
      way["highway"](${southLat},${westLon},${northLat},${eastLon});
    );
    out body;
    >;
    out skel qt;
    `;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `data=${encodeURIComponent(query)}`
        });

        if (!response.ok) throw new Error(`Overpass API error: ${response.statusText}`);

        const data = await response.json();
        
        // Parse into Game Splines for UE5 PCG (Procedural Content Generation)
        const nodeMap = new Map<number, GeoNode>();
        const paths: GameSplinePath[] = [];

        // First pass: collect all raw coordinate nodes
        for (const element of data.elements) {
            if (element.type === 'node') {
                nodeMap.set(element.id, { id: element.id, lat: element.lat, lon: element.lon });
            }
        }

        // Second pass: build ways (roads) into ordered arrays for Spline generation
        for (const element of data.elements) {
            if (element.type === 'way' && element.tags && element.tags.highway) {
                const wayNodes = (element.nodes || [])
                    .map((nodeId: number) => nodeMap.get(nodeId))
                    .filter(Boolean) as GeoNode[];
                    
                paths.push({
                    wayId: element.id,
                    highwayType: element.tags.highway,
                    nodes: wayNodes
                });
            }
        }

        return paths;
    } catch (error) {
        console.error("Failed to fetch environment data:", error);
        return [];
    }
};
