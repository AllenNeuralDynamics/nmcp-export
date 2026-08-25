import { describe, it, expect } from "vitest";
import { PortalAnnotationSpace } from "../src/io/portalJson";

// These are the raw values ../nmcp-api sends: its PortalAnnotationSpace enum (src/io/portalFormat.ts)
// crosses the wire untranslated because the GraphQL field is `annotationSpace: Int`, not an enum.
describe("PortalAnnotationSpace", () => {
    it("matches the API's wire values", () => {
        expect(PortalAnnotationSpace.Specimen).toBe(100);
        expect(PortalAnnotationSpace.Atlas).toBe(200);
    });
});
