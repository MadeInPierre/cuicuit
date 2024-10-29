// TODO when a user updates a space's name or icon, update the spaceDoc fields.
// Since it's hard to have permissions to update each member's userDocs to
// update their headers, we can just update the spaceDoc fields and let
// the userDoc headers be updated when the user opens the space.
export async function editSpace() {
    throw new Error('Not implemented');
}
