import {
  ExecCommand,
  SetPopupInfo,
  ToolbarItemInfo,
  GetBound,
  HideTooltip,
  ShowTooltip,
  ToolbarButtonInfo,
} from '@t/ui';
import { Emitter } from '@t/event';
import { closest, cls } from '@/utils/dom';
import html from '@/ui/vdom/template';
import { Component } from '@/ui/vdom/component';
import { ToolbarGroup } from './toolbarGroup';
import { connectHOC } from './buttonHoc';

interface Props {
  disabled: boolean;
  eventEmitter: Emitter;
  item: ToolbarButtonInfo;
  items: ToolbarItemInfo[];
  execCommand: ExecCommand;
  setPopupInfo: SetPopupInfo;
  showTooltip: ShowTooltip;
  hideTooltip: HideTooltip;
  getBound: GetBound;
}

interface State {
  dropdownPos: { right: number; top: number } | null;
  showDropdown: boolean;
  id: string;
}

const POPUP_INDENT = 4;

class DropdownToolbarButtonComp extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showDropdown: false,
      dropdownPos: null,
      id: `${cls('dropdown-toolbar')}-${Math.random().toString(16).substring(2, 15)}`,
    };
  }

  private getBound() {
    const rect = this.props.getBound(this.refs.el);

    rect.top += POPUP_INDENT;

    return { ...rect, left: null, right: 10 };
  }

  private hideDropdown() {
    const { showDropdown } = this.state;

    this.setState({ showDropdown: false, dropdownPos: null });

    if (showDropdown) {
      this.refs.el.focus();
    }
  }

  private handleClickDocument = ({ target }: MouseEvent) => {
    if (
      !closest(target as HTMLElement, `.${cls('dropdown-toolbar')}`) &&
      !closest(target as HTMLElement, '.more')
    ) {
      this.hideDropdown();
    }
  };

  private handleKeyDown = ({ key }: KeyboardEvent) => {
    if (key === 'Escape' && this.state.showDropdown) {
      this.hideDropdown();
    }
  };

  mounted() {
    document.addEventListener('click', this.handleClickDocument);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  updated() {
    if (this.state.showDropdown && !this.state.dropdownPos) {
      this.setState({ dropdownPos: this.getBound() });
    }
  }

  beforeDestroy() {
    document.removeEventListener('click', this.handleClickDocument);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private showTooltip = () => {
    this.props.showTooltip(this.refs.el);
  };

  render() {
    const { showDropdown, dropdownPos, id } = this.state;
    const { disabled, item, items, hideTooltip } = this.props;
    const visibleItems = items.filter((dropdownItem) => !dropdownItem.hidden);
    const groupStyle = visibleItems.length ? null : { display: 'none' };
    const dropdownStyle = showDropdown ? null : { display: 'none' };

    return html`
      <div class="${cls('toolbar-group')}" style=${groupStyle}>
        <button
          ref=${(el: HTMLElement) => (this.refs.el = el)}
          type="button"
          class=${item.className}
          onClick=${() => this.setState({ showDropdown: true })}
          onMouseover=${this.showTooltip}
          onFocus=${this.showTooltip}
          onBlur=${hideTooltip}
          disabled=${disabled}
          aria-label=${item.tooltip}
          aria-haspopup=${item.ariaHasPopup}
          aria-expanded=${item.ariaHasPopup && showDropdown}
          aria-controls="${id}"
        >
          <span class="${cls('toolbar-button-name')}">${item.tooltip || ''}</span>
        </button>
        <div
          id="${id}"
          class="${cls('dropdown-toolbar')}"
          style=${{ ...dropdownStyle, ...dropdownPos }}
          ref=${(el: HTMLElement) => (this.refs.dropdownEl = el)}
        >
          ${visibleItems.length
            ? visibleItems.map(
                (group, index) => html`
                  <${ToolbarGroup}
                    group=${group}
                    hiddenDivider=${index === visibleItems.length - 1 ||
                    (visibleItems as ToolbarButtonInfo[])[index + 1]?.hidden}
                    ...${this.props}
                  />
                `
              )
            : null}
        </div>
      </div>
    `;
  }
}
export const DropdownToolbarButton = connectHOC(DropdownToolbarButtonComp);
