import { OngoingEffect } from './OngoingEffect';
import { RelativePlayer, WildcardLocation, WildcardCardType, CardTypeFilter, LocationFilter, RelativePlayerValues } from '../Constants';
import * as EnumHelpers from '../utils/EnumHelpers';
import * as Contract from '../utils/Contract';
import * as Helpers from '../utils/Helpers';
import Game from '../Game';
import { Card } from '../card/Card';
import { IOngoingCardEffectProps } from '../../Interfaces';
import { OngoingEffectImpl } from './effectImpl/OngoingEffectImpl';
import { AbilityContext } from '../ability/AbilityContext';

export class OngoingCardEffect extends OngoingEffect {
    public readonly targetsSourceOnly: boolean;
    public readonly targetLocationFilter: LocationFilter;
    public readonly targetCardTypeFilter: CardTypeFilter[];
    public readonly targetController: RelativePlayer;
    public override matchTarget: Card | ((target: Card, context: AbilityContext) => boolean);

    public constructor(game: Game, source: Card, properties: IOngoingCardEffectProps, effect: OngoingEffectImpl<any>) {
        super(game, source, properties, effect);

        if (!properties.matchTarget) {
            // if there are no filters provided, effect only targets the source card
            if (!properties.targetLocationFilter && !properties.targetCardTypeFilter && !properties.targetController) {
                this.targetsSourceOnly = true;
                return;
            }
        }

        this.targetsSourceOnly = false;
        this.targetController = properties.targetController || RelativePlayer.Self;
        Contract.assertArrayIncludes(RelativePlayerValues, this.targetController, "target controller must be a RelativePlayer enum.");

        if (!properties.targetLocationFilter) {
            this.targetLocationFilter = properties.sourceLocationFilter === WildcardLocation.Any
                ? WildcardLocation.Any
                : WildcardLocation.AnyArena;
        } else {
            this.targetLocationFilter = properties.targetLocationFilter;
        }

        // TODO: rework getTargets() so that we can provide an array while still not searching all cards in the game every time
        Contract.assertFalse(Array.isArray(properties.targetLocationFilter), 'Target location filter for an effect definition cannot be an array');

        this.targetCardTypeFilter = properties.targetCardTypeFilter ? Helpers.asArray(properties.targetCardTypeFilter) : [WildcardCardType.Unit];
    }

    /** @override */
    public override isValidTarget(target: Card) {
        if (this.targetsSourceOnly) {
            return target === this.context.source;
        }

        if (typeof this.matchTarget !== 'function') {
            if (target === this.matchTarget) {
                // This is a hack to check whether this is a lasting effect
                return true;
            }

            return false;
        }

        return (
            (this.targetController !== RelativePlayer.Self || target.controller === this.source.controller) &&
            (this.targetController !== RelativePlayer.Opponent || target.controller !== this.source.controller) &&
            EnumHelpers.cardLocationMatches(target.location, this.targetLocationFilter) &&
            EnumHelpers.cardTypeMatches(target.type, this.targetCardTypeFilter) &&
            this.matchTarget(target, this.context)
        );
    }

    /** @override */
    public override getTargets() {
        if (this.targetsSourceOnly) {
            return [this.context.source];
        } else if (this.targetLocationFilter === WildcardLocation.Any) {
            return this.game.allCards;
        } else if (EnumHelpers.isArena(this.targetLocationFilter)) {
            return this.game.findAnyCardsInPlay();
        }
        return this.game.allCards;
    }
}