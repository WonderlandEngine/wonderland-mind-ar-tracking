import {Cursor} from '@wonderlandengine/components/dist/cursor';
import {mat4} from 'gl-matrix';
/**
 * cursor-custom
 */
export class CursorCustom extends Cursor {
    static TypeName = 'cursor-custom';
    /* Properties that are configurable in the editor */
    static InheritProperties = true;

    update(dt) {
        /* Called every frame. */

        mat4.invert(this._projectionMatrix, this._viewComponent.projectionMatrix);
        super.update(dt);
    }
}
