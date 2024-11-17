import { OngoingEffect } from './OngoingEffect';
import { RelativePlayer } from '../Constants';
import { OngoingEffectImpl } from './effectImpl/OngoingEffectImpl';
import Game from '../Game';
import { Card } from '../card/Card';
import { IOngoingEffectProps } from '../../Interfaces';
import Player from '../Player';

export class OngoingPlayerEffect extends OngoingEffect {
    public override matchTarget: (target: Player) => boolean;

    public constructor(game: Game, source: Card, properties: IOngoingEffectProps, effect: OngoingEffectImpl<any>) {
        super(game, source, properties, effect);
        if (typeof this.matchTarget !== 'function') {
            this.matchTarget = (_player) => true;
        }
    }

    /** @override */
    public override isValidTarget(target) {
        if (this.targetController !== RelativePlayer.Any && this.targetController !== RelativePlayer.Self && this.targetController !== RelativePlayer.Opponent && this.targetController !== target) {
            return false;
        }

        if (this.targetController === RelativePlayer.Self && target === this.source.controller.opponent) {
            return false;
        } else if (this.targetController === RelativePlayer.Opponent && target === this.source.controller) {
            return false;
        }
        return true;
    }

    /** @override */
    public override getTargets() {
        return this.game.getPlayers().filter((player) => this.matchTarget(player));
    }
}
