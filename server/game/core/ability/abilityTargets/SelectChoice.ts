import { TargetMode } from '../../Constants';

export class SelectChoice {
    constructor(public choice: string) {}

    getShortSummary() {
        return {
            id: this.choice,
            label: this.choice,
            name: this.choice,
            type: TargetMode.Select
        };
    }
}
