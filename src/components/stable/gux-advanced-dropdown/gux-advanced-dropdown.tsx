import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Listen,
  Method,
  Prop,
  State,
  Watch
} from '@stencil/core';

import { trackComponent } from '../../../usage-tracking';
import { buildI18nForComponent, GetI18nValue } from '../../../i18n';

import advancedDropDownResources from './i18n/en.json';

@Component({
  styleUrl: 'gux-advanced-dropdown.less',
  tag: 'gux-advanced-dropdown',
  shadow: true
})
export class GuxAdvancedDropdown {
  @Element()
  root: HTMLElement;

  searchElement: HTMLGuxSearchBetaElement;
  inputBox: HTMLElement;

  private i18n: GetI18nValue;

  /**
   * Disable the input and prevent interactions.
   */
  @Prop()
  disabled: boolean = false;

  /**
   * The dropdown's placeholder.
   */
  @Prop()
  placeholder: string;

  /**
   * Whether the list should filter its current options.
   */
  @Prop()
  noFilter: boolean = false;

  /**
   * Timeout between filter input changed and event being emitted.
   */
  @Prop()
  filterDebounceTimeout: number = 500;

  /**
   * Fires when the value of the advanced dropdown changes.
   */
  @Event()
  input: EventEmitter<string>;

  /**
   * Fires when the filter of the advanced dropdown changes.
   */
  @Event()
  filter: EventEmitter<string>;

  @State()
  srLabelledby: string;

  @State()
  opened: boolean;

  @State()
  currentlySelectedOption: HTMLGuxDropdownOptionElement;

  @State()
  selectionOptions: HTMLGuxDropdownOptionElement[];

  slotObserver = new MutationObserver(records =>
    this.handleSlotChange(records)
  );

  @Watch('disabled')
  watchValue(newValue: boolean) {
    if (this.opened && newValue) {
      this.closeDropdown(false);
    }
  }

  get value(): string {
    return this.currentlySelectedOption?.text;
  }

  /**
   * Gets the currently selected values.
   *
   * @returns The array of selected values.
   */
  @Method()
  getSelectedValues(): Promise<string[]> {
    // Once multi-select gets added there will
    // be multiple values selectable.
    return Promise.resolve([this.value]);
  }

  @Method()
  async setLabeledBy(id: string) {
    this.srLabelledby = id;
  }

  @Listen('focusout')
  onFocusOut(e: FocusEvent) {
    if (!e.relatedTarget || !this.root.contains(e.relatedTarget as Node)) {
      this.closeDropdown(false);
    }
  }

  async componentWillLoad() {
    trackComponent(this.root);
    this.i18n = await buildI18nForComponent(
      this.root,
      advancedDropDownResources
    );

    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    this.updateSelectionState();
    this.addOptionListeners();
  }

  componentDidLoad() {
    this.slotObserver.observe(this.root, {
      subtree: true,
      childList: true,
      attributes: true
    });
  }

  disconnectedCallback() {
    this.slotObserver.disconnect();
  }

  render() {
    return (
      <div
        class={`gux-dropdown
        ${this.disabled ? 'gux-disabled' : ''}
        ${this.opened ? 'gux-active' : ''}`}
      >
        <div class="gux-select-field" onMouseDown={() => this.inputMouseDown()}>
          <a
            ref={el => (this.inputBox = el)}
            class="gux-select-input"
            aria-labelledby={this.srLabelledby}
            tabindex="0"
            onKeyDown={e => this.inputKeyDown(e)}
          >
            {this.placeholder && !this.value && (
              <span class="gux-select-placeholder">{this.placeholder}</span>
            )}
            {this.value && <span class="gux-select-value">{this.value}</span>}
          </a>
          <div class="gux-icon-wrapper">
            <gux-icon decorative iconName="ic-dropdown-arrow"></gux-icon>
          </div>
        </div>
        <div
          class={`gux-advanced-dropdown-menu ${
            this.opened ? 'gux-opened' : ''
          }`}
        >
          <div class="gux-dropdown-menu-container">
            <gux-search-beta
              ref={el => (this.searchElement = el as HTMLGuxSearchBetaElement)}
              class="gux-light-theme"
              srLabel={this.i18n('searchAria')}
              dynamic-search="true"
              onInput={e => e.stopPropagation()}
              onSearch={e => this.searchRequested(e)}
              searchTimeout={this.filterDebounceTimeout}
            />
            <div
              class="gux-dropdown-options"
              onKeyDown={e => this.optionsKeyDown(e)}
            >
              <slot />
            </div>
          </div>
        </div>
      </div>
    );
  }

  private updateSelectionState(): void {
    this.selectionOptions = this.getSelectionOptions();
    this.currentlySelectedOption = this.selectionOptions.find(
      option => option.selected
    );
  }

  private addOptionListeners(options: Node[] = this.selectionOptions): void {
    options.forEach(option =>
      option.addEventListener('selectedChanged', this.handleSelectionChange)
    );
  }

  private removeOptionListeners(options: Node[] = this.selectionOptions): void {
    options.forEach(option =>
      option.removeEventListener('selectedChanged', this.handleSelectionChange)
    );
  }

  private handleSelectionChange({ target }: CustomEvent): void {
    const option = target as HTMLGuxDropdownOptionElement;

    this.input.emit(option.value);
    this.closeDropdown(true);

    if (this.currentlySelectedOption) {
      this.currentlySelectedOption.selected = false;
    }
    this.currentlySelectedOption = option;
  }

  private handleSlotChange(records: MutationRecord[]): void {
    const OPTION_NAME = 'GUX-DROPDOWN-OPTION';
    const hasSelectionChanges = records.find(
      record =>
        record.target.nodeName === OPTION_NAME &&
        record.type === 'attributes' &&
        record.attributeName === 'selected'
    );

    const optionAdditions = records
      .filter(record => record.type === 'childList' && record.addedNodes)
      .map(record => Array.from(record.addedNodes))
      .reduce((acc, val) => acc.concat(val), [])
      .filter(node => node.nodeName === OPTION_NAME);

    const optionRemovals = records
      .filter(record => record.type === 'childList' && record.removedNodes)
      .map(record => Array.from(record.removedNodes))
      .reduce((acc, val) => acc.concat(val), [])
      .filter(node => node.nodeName === OPTION_NAME);

    if (hasSelectionChanges) {
      this.updateSelectionState();
    }

    if (optionAdditions) {
      this.updateSelectionState();
      this.addOptionListeners(optionAdditions);
    }

    if (optionRemovals) {
      this.updateSelectionState();
      this.removeOptionListeners(optionRemovals);
    }
  }

  private getSelectionOptions(): HTMLGuxDropdownOptionElement[] {
    const options = this.root.querySelectorAll('gux-dropdown-option');

    return Array.from(options);
  }

  private inputMouseDown() {
    if (this.disabled) {
      return;
    }

    if (this.opened) {
      this.closeDropdown(true);
    } else {
      this.openDropdown(false);
    }
  }

  private getFocusIndex(): number {
    return this.selectionOptions.findIndex(option => {
      return option.matches(':focus');
    });
  }

  private optionsKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp': {
        const focusIndex = this.getFocusIndex();
        if (focusIndex > 0) {
          this.selectionOptions[focusIndex - 1].focus();
        }
        break;
      }
      case 'ArrowDown': {
        const focusIndex = this.getFocusIndex();
        if (focusIndex < this.selectionOptions.length - 1) {
          this.selectionOptions[focusIndex + 1].focus();
        }
        break;
      }
      case 'Home':
        if (!this.selectionOptions.length) {
          return;
        }
        this.selectionOptions[0].focus();
        break;
      case 'End':
        if (!this.selectionOptions.length) {
          return;
        }
        this.selectionOptions[this.selectionOptions.length - 1].focus();
        break;
      default:
    }
  }

  private inputKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case ' ':
        this.openDropdown(true);
        break;
      default:
    }
  }

  private searchRequested(event: CustomEvent) {
    this.filter.emit(event.detail);

    if (!this.noFilter) {
      for (const option of this.selectionOptions) {
        option.shouldFilter(event.detail).then(isFiltered => {
          option.filtered = isFiltered;
        });
      }
    }
  }

  private changeFocusToSearch() {
    setTimeout(() => {
      this.searchElement.setInputFocus();
    });
  }

  private openDropdown(focusSearch: boolean) {
    this.opened = true;

    if (focusSearch) {
      this.changeFocusToSearch();
    }
  }

  private closeDropdown(focus: boolean) {
    this.opened = false;
    this.searchElement.value = '';

    if (focus) {
      this.inputBox.focus();
    }
  }
}
