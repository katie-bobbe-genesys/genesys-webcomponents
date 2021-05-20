import { Component, Element, h, Host, JSX, Prop } from '@stencil/core';

import { buildI18nForComponent, GetI18nValue } from '../../../i18n';

import { trackComponent } from '../../../usage-tracking';

import modalComponentResources from './i18n/en.json';

const RADIUS = 23.5;
const STROKE_DASH = 2 * Math.PI * RADIUS;

let idCounter = 0;

@Component({
  styleUrl: 'gux-radial-progress.less',
  tag: 'gux-radial-progress'
})
export class GuxRadialProgress {
  @Element()
  private root: HTMLElement;
  private getI18nValue: GetI18nValue;

  /**
   * The progress made in the progress spinner compared to the max value
   */
  @Prop()
  value: number;

  /**
   * The max value of the progress spinner
   */
  @Prop()
  max: number = 100;

  private dropshadowId = `dropshadow-${idCounter++}`;

  async componentWillLoad(): Promise<void> {
    trackComponent(this.root);

    this.getI18nValue = await buildI18nForComponent(
      this.root,
      modalComponentResources
    );
  }

  render(): JSX.Element {
    return this.canShowPercentage(this.value, this.max)
      ? this.showPercentageState(this.value, this.max)
      : this.showSpinnerState();
  }

  private canShowPercentage(value, max) {
    return !(isNaN(value) || isNaN(max) || value > max || value < 0);
  }

  private showPercentageState(value, max): JSX.Element {
    return (
      <Host>
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin="0"
          aria-valuemax={max}
        >
          <svg
            class="gux-svg-container"
            width="60px"
            height="60px"
            viewBox="0 0 60 60"
          >
            <filter id={this.dropshadowId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              <feOffset dx="0" dy="0" result="offsetblur" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <circle cx="50%" cy="50%" r={RADIUS} class="gux-static-circle" />
            <circle
              cx="50%"
              cy="50%"
              r={RADIUS}
              class="gux-dynamic-circle"
              stroke-dashoffset={STROKE_DASH * (1 - value / max)}
              stroke-dasharray={STROKE_DASH}
              filter={'url(#' + this.dropshadowId + ')'}
            />

            <text
              x="50%"
              y="50%"
              dominant-baseline="central"
              class="gux-percentage"
            >
              {`${Math.round((value / max) * 100)}%`}
            </text>
          </svg>
        </div>

        <span class="gux-progress-alert" role="alert" aria-live="polite">
          {Math.round((value / max) * 100) < 100
            ? `${Math.round((value / max) * 100)}%`
            : this.getI18nValue('loadingComplete')}
        </span>
      </Host>
    );
  }

  private showSpinnerState(): JSX.Element {
    return <gux-radial-loading context="modal"></gux-radial-loading>;
  }
}
