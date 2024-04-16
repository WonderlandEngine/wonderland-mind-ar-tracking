import {Component, Property} from '@wonderlandengine/api';
import {CursorTarget, HowlerAudioSource} from '@wonderlandengine/components';

/**
 * Button component.
 *
 * Moves backward on cursor down,
 * Returns to its position on cursor up
 * Plays click/unclick sounds
 *
 */
export class ButtonComponent extends Component {
    static TypeName = 'button';
    static Properties = {};

    static onRegister(engine) {
        engine.registerComponent(HowlerAudioSource);
        engine.registerComponent(CursorTarget);
    }

    /* Position to return to when "unpressing" the button */
    returnPos = new Float32Array(3);

    start() {
        this.object.getPositionLocal(this.returnPos);

        this.target =
            this.object.getComponent(CursorTarget) ||
            this.object.addComponent(CursorTarget);

        this.soundClick = this.object.addComponent(HowlerAudioSource, {
            src: 'sfx/click.wav',
            spatial: true,
        });
        this.soundUnClick = this.object.addComponent(HowlerAudioSource, {
            src: 'sfx/unclick.wav',
            spatial: true,
        });
    }

    onActivate() {
        this.target.onHover.add(this.onHover);
        this.target.onUnhover.add(this.onUnhover);
        this.target.onDown.add(this.onDown);
        this.target.onUp.add(this.onUp);
    }

    onDeactivate() {
        this.target.onHover.remove(this.onHover);
        this.target.onUnhover.remove(this.onUnhover);
        this.target.onDown.remove(this.onDown);
        this.target.onUp.remove(this.onUp);
    }

    /* Called by 'cursor-target' */
    onHover = (_, cursor) => {
        if (cursor.type === 'finger-cursor') {
            this.onUp(_, cursor);
        }
    };

    /* Called by 'cursor-target' */
    onDown = (_, cursor) => {
        this.soundClick.play();
        this.object.translateLocal([0.0, -0.1, 0.0]);
    };

    /* Called by 'cursor-target' */
    onUp = (_, cursor) => {
        this.soundUnClick.play();
        this.object.setPositionLocal(this.returnPos);
        hapticFeedback(cursor.object, 0.7, 20);
    };

    /* Called by 'cursor-target' */
    onUnhover = (_, cursor) => {
        if (cursor.type === 'finger-cursor') {
            this.onUp(_, cursor);
        }
    };
}
