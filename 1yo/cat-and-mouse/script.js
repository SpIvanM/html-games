/**
 * @file Manages the interactive kitten application.
 * The kitten's pupils follow the mouse cursor, and the app can be toggled to full-screen.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- DOM Element Selection ---
    const pupilLeft = document.getElementById('pupil-left');
    const pupilRight = document.getElementById('pupil-right');
    // BUG FIX: Target the main SVG element, which has a reliable bounding box.
    const kittenSVG = document.getElementById('kitten');

    // --- Constants and State ---
    // Maximum distance the pupil can move from the center of the iris.
    const maxPupilDisplacement = 8; 

    /**
     * Initializes the application by setting up event listeners.
     */
    function init() {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('dblclick', toggleFullScreen);
    }

    /**
     * Handles the mouse move event to update the pupil positions.
     * @param {MouseEvent} event - The mouse move event object.
     */
    function handleMouseMove(event) {
        // Get the current mouse coordinates.
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        updatePupilPosition(mouseX, mouseY);
    }

    /**
     * Calculates and applies the new position for the pupils based on the cursor's location.
     * @param {number} mouseX - The x-coordinate of the mouse.
     * @param {number} mouseY - The y-coordinate of the mouse.
     */
    function updatePupilPosition(mouseX, mouseY) {
        // Recalculate the SVG's center on each mouse move.
        // This ensures the center point is always accurate, even if the window is resized.
        const svgRect = kittenSVG.getBoundingClientRect();
        const svgCenterX = svgRect.left + svgRect.width / 2;
        const svgCenterY = svgRect.top + svgRect.height / 2;

        // Calculate the vector from the SVG center to the mouse cursor.
        const deltaX = mouseX - svgCenterX;
        const deltaY = mouseY - svgCenterY;

        // Calculate the angle of the vector.
        const angle = Math.atan2(deltaY, deltaX);

        // Calculate the distance from the center, but cap it to a reasonable value
        // to prevent extreme movements when the cursor is far away.
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 200);

        // Scale the distance to determine the pupil's offset.
        const pupilMoveDistance = (distance / 200) * maxPupilDisplacement;
        
        // Calculate the new x and y offsets for the pupil's transform.
        const pupilX = pupilMoveDistance * Math.cos(angle);
        const pupilY = pupilMoveDistance * Math.sin(angle);

        // Apply the same transformation to both pupils so they move in unison.
        pupilLeft.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
        pupilRight.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
    }

    /**
     * Toggles the browser's full-screen mode.
     */
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            // If not in full-screen, request it.
            document.documentElement.requestFullscreen().catch(err => {
                // Log error if request fails (e.g., not triggered by user action).
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            // If in full-screen, exit it.
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Start the application.
    init();
});