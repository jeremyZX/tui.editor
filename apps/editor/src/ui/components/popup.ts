import { ExecCommand, HidePopup, PopupInfo, Pos } from '@t/ui';
import { Emitter } from '@t/event';
import { closest, cls } from '@/utils/dom';
import { shallowEqual } from '@/utils/common';
import html from '../vdom/template';
import { Component } from '../vdom/component';

type PopupStyle = {
  display: 'none' | 'block';
} & Partial<Pos>;

interface Props {
  show: boolean;
  info: PopupInfo;
  eventEmitter: Emitter;
  hidePopup: HidePopup;
  execCommand: ExecCommand;
}

interface State {
  popupPos: Pos | null;
}

const MARGIN_FROM_RIGHT_SIDE = 20;

export class Popup extends Component<Props, State> {
  private handleMousedown = (ev: MouseEvent) => {
    if (
      !closest(ev.target as HTMLElement, `.${cls('popup')}`) &&
      !closest(ev.target as HTMLElement, this.props.info.fromEl)
    ) {
      this.props.hidePopup();
    }
  };

  private handleKeyDown = (ev: KeyboardEvent) => {
    const { show } = this.props;

    if (!show) {
      return;
    }

    if (ev.key === 'Escape') {
      // Close popup on Escape keypress
      this.props.hidePopup();
    } else if (ev.key === 'Tab') {
      // Trap focus within popup
      this.handleTabKey(ev);
    } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
      this.handleArrowKey(ev);
    }
  };

  private handleTabKey(ev: KeyboardEvent) {
    const popup = this.refs.el;

    if (popup.querySelector('[role="menu"]')) {
      this.props.hidePopup();
      return;
    }

    const focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const firstFocusableElement = popup.querySelectorAll(focusableElements)[0] as HTMLElement;
    const focusableContent = popup.querySelectorAll(focusableElements) as NodeListOf<HTMLElement>;
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    if (!firstFocusableElement) {
      return;
    }

    if (ev.shiftKey && document.activeElement === firstFocusableElement) {
      lastFocusableElement.focus();
      ev.preventDefault();
    } else if (!ev.shiftKey && document.activeElement === lastFocusableElement) {
      firstFocusableElement.focus();
      ev.preventDefault();
    }
  }

  private handleArrowKey(ev: KeyboardEvent) {
    const popup = this.refs.el;

    if (!popup.querySelector('[role="menu"]')) {
      return;
    }

    const focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const firstFocusableElement = popup.querySelectorAll(focusableElements)[0] as HTMLElement;
    const focusableContent = Array.from(
      popup.querySelectorAll(focusableElements) as NodeListOf<HTMLElement>
    );
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    if (ev.key === 'ArrowUp' && document.activeElement === firstFocusableElement) {
      lastFocusableElement.focus();
    } else if (ev.key === 'ArrowDown' && document.activeElement === lastFocusableElement) {
      firstFocusableElement.focus();
      ev.preventDefault();
    } else if (ev.key === 'ArrowUp') {
      const currentFocusIndex = focusableContent.indexOf(document.activeElement as HTMLElement);

      focusableContent[currentFocusIndex - 1].focus();
    } else if (ev.key === 'ArrowDown') {
      const currentFocusIndex = focusableContent.indexOf(document.activeElement as HTMLElement);

      focusableContent[currentFocusIndex + 1].focus();
    }
  }

  mounted() {
    document.addEventListener('mousedown', this.handleMousedown);
    document.addEventListener('keydown', this.handleKeyDown);
    this.props.eventEmitter.listen('closePopup', this.props.hidePopup);
  }

  beforeDestroy() {
    document.removeEventListener('mousedown', this.handleMousedown);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  updated(prevProps: Props) {
    const { show, info } = this.props;

    if (show && info.pos && prevProps.show !== show) {
      const popupPos = { ...info.pos };
      const { offsetWidth } = this.refs.el;
      const toolbarEl = closest(this.refs.el, `.${cls('toolbar')}`) as HTMLElement;
      const { offsetWidth: toolbarOffsetWidth } = toolbarEl;

      if (popupPos.left + offsetWidth >= toolbarOffsetWidth) {
        popupPos.left = toolbarOffsetWidth - offsetWidth - MARGIN_FROM_RIGHT_SIDE;
      }
      if (!shallowEqual(this.state.popupPos, popupPos)) {
        this.setState({ popupPos });
      }

      // Trigger focus on first focusable element
      const focusableElements =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const firstFocusableElement = this.refs.el.querySelectorAll(
        focusableElements
      )[0] as HTMLElement;

      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    } else if (!show && prevProps.show !== show) {
      // Return focus to opener
      const opener = this.props.info.fromEl as HTMLElement;

      opener.focus();
    }
  }

  render() {
    const { info, show, hidePopup, eventEmitter, execCommand } = this.props;
    const { className = '', style, render, initialValues = {} } = info || {};
    const popupStyle: PopupStyle = {
      display: show ? 'block' : 'none',
      ...style,
      ...this.state.popupPos,
    };

    return html`
      <div
        class="${cls('popup')} ${className}"
        style=${popupStyle}
        ref=${(el: HTMLElement) => (this.refs.el = el)}
      >
        <div class="${cls('popup-body')}">
          ${render && render({ eventEmitter, show, hidePopup, execCommand, initialValues })}
        </div>
      </div>
    `;
  }
}
