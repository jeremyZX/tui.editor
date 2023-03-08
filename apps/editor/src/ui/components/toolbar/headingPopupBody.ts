import { Emitter } from '@t/event';
import { ExecCommand } from '@t/ui';
import i18n from '@/i18n/i18n';
import html from '@/ui/vdom/template';
import { Component } from '@/ui/vdom/component';
import { cls } from '@/utils/dom';

interface Props {
  eventEmitter: Emitter;
  execCommand: ExecCommand;
}

interface State {
  id: string;
}

export class HeadingPopupBody extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      id: `${cls('menu-headings')}-${Math.random().toString(16).substring(2, 15)}`,
    };
  }

  execCommand(level: number | null) {
    this.props.execCommand('heading', {
      level,
    });
  }

  render() {
    const { id } = this.state;

    return html`
      <ul
        role="menu"
        aria-label="${i18n.get('Headings')}"
        class="${cls('menu-headings')}"
        id="${id}"
      >
        ${[1, 2, 3, 4, 5, 6].map(
          (level) => html`
            <li data-type="Heading" role="none">
              <${`h${level}`} role="presentation">
                <button type="button" role="menuitem" onClick=${() => this.execCommand(level)}>
                  ${i18n.get('Heading')} ${level}
                </button>
              </$>
            </li>
          `
        )}
        <li data-type="Paragraph" role="none">
          <div>
            <button type="button" role="menuitem" onClick=${() => this.execCommand(null)}>
              ${i18n.get('Paragraph')}
            </button>
          </div>
        </li>
      </ul>
    `;
  }
}
