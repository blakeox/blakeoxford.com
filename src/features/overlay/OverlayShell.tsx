import type { ReactNode, RefObject } from 'react';

import { cn } from '../../utils/cn';
import {
 OVERLAY_BACKDROP,
 OVERLAY_DRAG_HANDLE,
 OVERLAY_FRAME,
 OVERLAY_PANEL,
 OVERLAY_PANEL_ASK,
} from './overlayStyles';

type OverlayShellProps = {
 isOpen: boolean;
 onClose: () => void;
 labelledBy: string;
 children: ReactNode;
 panelRef?: RefObject<HTMLDivElement | null>;
 variant?: 'find' | 'ask';
 id?: string;
 /** Extra attributes for the root (e.g. data-command-center) */
 rootProps?: React.HTMLAttributes<HTMLDivElement> & Record<string, string | boolean | undefined>;
 onPanelClick?: (event: React.MouseEvent) => void;
 onTouchStart?: (event: React.TouchEvent) => void;
 onTouchMove?: (event: React.TouchEvent) => void;
 onTouchEnd?: (event: React.TouchEvent) => void;
};

export function OverlayShell({
 isOpen,
 onClose,
 labelledBy,
 children,
 panelRef,
 variant = 'find',
 id,
 rootProps,
 onPanelClick,
 onTouchStart,
 onTouchMove,
 onTouchEnd,
}: OverlayShellProps) {
 const panelClass = variant === 'ask' ? OVERLAY_PANEL_ASK : OVERLAY_PANEL;
 const {
 className: rootClassName,
 style: rootStyle,
 ...restRootProps
 } = rootProps ?? {};
 const zClass = variant === 'ask' ? 'z-chat' : 'z-search';

 return (
 <div
 id={id}
 role="presentation"
 aria-hidden={!isOpen}
 inert={!isOpen}
 data-state={isOpen ? 'open' : 'closed'}
 className={cn(
  // Visibility is driven by toggling the display utility (flex/hidden) so no
  // inline display styles and no !important are needed. Both utilities live in
  // Tailwind's utilities layer, so exactly one applies deterministically.
  'overlay-root fixed inset-0 transition duration-normal ease-standard motion-reduce:transition-none',
  zClass,
  isOpen ? 'flex opacity-100' : 'hidden pointer-events-none opacity-0',
  rootClassName,
 )}
 style={rootStyle}
 {...restRootProps}
 >
 <button
 type="button"
 className={OVERLAY_BACKDROP}
 aria-label="Close"
 tabIndex={-1}
 onClick={onClose}
 />

 <div className={OVERLAY_FRAME}>
 <div
 ref={panelRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby={labelledBy}
 className={cn(panelClass, variant === 'ask' && 'ai-chat-panel')}
 data-panel
 data-ai-chat-panel={variant === 'ask' ? true : undefined}
 data-ai-visible={variant === 'ask' ? (isOpen ? 'true' : 'false') : undefined}
 onClick={onPanelClick}
 onTouchStart={onTouchStart}
 onTouchMove={onTouchMove}
 onTouchEnd={onTouchEnd}
 >
 <div className={OVERLAY_DRAG_HANDLE} aria-hidden="true" />
 {children}
 </div>
 </div>
 </div>
 );
}
