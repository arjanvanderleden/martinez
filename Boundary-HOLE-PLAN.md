Core Concepts

  1. Spatial Hierarchy in Polygon Processing

  - Action: Understand that contours exist in nested spatial relationships
  - Rationale: In polygon clipping operations, resulting contours can be
  either exterior boundaries or interior holes, with holes potentially
  containing other contours
  - Key Insight: The nesting level determines classification - even depths
  are exterior contours, odd depths are holes

  2. Context-Driven Classification Approach

  - Action: Leverage spatial context from previously processed contours to
  classify new ones
  - Rationale: When processing contours in order, each new contour's
  relationship can be determined by examining what lies "below" it
  spatially
  - Core Principle: Use the vertical sweep concept - contours processed
  earlier provide context for later ones

  Implementation Approach

  Step 1: Establish Spatial Context Tracking

  - Action: During contour processing, maintain information about which
  contour lies immediately below the current processing position
  - Rationale: The Martinez algorithm uses prevInResult to track the most
  recent contour that would be encountered when moving vertically downward
  from the current position
  - Key Data: Track both the contour identifier and the transition type
  (entering vs. exiting that contour)

  Step 2: Implement Result Transition Analysis

  - Action: Determine whether you are "inside" or "outside" a contour when
  starting a new contour
  - Rationale: This inside/outside status determines the new contour's
  classification
  - Logic:
    - Positive transition = entering a contour (moving from outside to
  inside)
    - Negative transition = exiting a contour (moving from inside to
  outside)
    - This information comes from the polygon clipping algorithm's edge
  classification

  Step 3: Apply Hierarchy Rules

  - Action: Use the spatial context to establish parent-child relationships
  - Rationale: The relationship depends on what type of contour lies below
  and the transition direction
  - Rules:
    - If starting inside another contour → new contour is a hole
    - If starting outside → new contour is an exterior boundary
    - If the lower contour is already a hole → the new hole connects to the
   same parent
    - If the lower contour is exterior → the new hole becomes its child

  Step 4: Implement Depth Tracking

  - Action: Maintain a depth counter that tracks nesting level
  - Rationale: Depth provides a secondary validation and helps with complex
   nesting scenarios
  - Logic:
    - Exterior contours maintain the same depth as their spatial context
    - Holes increment depth relative to their parent
    - Holes nested within other holes maintain consistent depth
  relationships

  Step 5: Build Parent-Child Data Structure

  - Action: Create bidirectional relationships between parent and child
  contours
  - Rationale: Enables efficient traversal and validation of the hierarchy
  - Components:
    - holeOf property: points from hole to its parent contour
    - holeIds array: lists all holes belonging to a parent contour
    - Depth value for validation and ordering

  Critical Implementation Details

  Context Preservation

  - The "previous in result" concept requires maintaining state across
  contour processing
  - This context must include both the contour identifier and the
  transition type
  - The spatial ordering of sweep events naturally provides this context

  Transition Type Significance

  - Positive transitions indicate the sweep line is entering a filled
  region
  - Negative transitions indicate the sweep line is exiting a filled region
  - This information is already computed by polygon clipping algorithms
  during edge classification

  Hierarchy Validation

  - The resulting hierarchy should satisfy geometric constraints
  - Every hole must be spatially contained within its designated parent
  - Depth values should increase monotonically along any parent-to-child
  path

  Algorithm Integration Points

  During Contour Creation

  - Query the spatial context before creating each new contour
  - Apply hierarchy rules to determine parent-child relationships
  - Update both parent and child data structures

  After Edge Connection

  - Validate that the geometric hierarchy matches the logical hierarchy
  - Ensure all holes are properly associated with their containing
  boundaries
  - Handle any edge cases where spatial relationships are ambiguous

  This approach adapts the Martinez algorithm's proven method for
  establishing polygon hierarchy without requiring modification to the core
   sweep line or edge connection logic.