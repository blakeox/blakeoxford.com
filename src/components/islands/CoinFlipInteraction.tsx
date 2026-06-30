import { useEffect } from 'react';

interface Props {
 rootId: string;
 innerId: string;
 liveRegionId: string;
 flipOnClick: boolean;
}

export default function CoinFlipInteraction({ rootId, innerId, liveRegionId, flipOnClick }: Props) {
 useEffect(() => {
 const root = document.getElementById(rootId);
 const inner = document.getElementById(innerId);
 const liveRegion = document.getElementById(liveRegionId);
 if (!root || !inner || !liveRegion) return;

 let flipped = false;

 const announce = (message: string) => {
 liveRegion.textContent = message;
 setTimeout(() => {
 liveRegion.textContent = '';
 }, 750);
 };

 const toggleFlip = () => {
 flipped = !flipped;
 root.setAttribute('aria-pressed', flipped ? 'true' : 'false');
 const axis = root.dataset.flipAxis === 'X' ? 'X' : 'Y';
 inner.style.transform = flipped
 ? axis === 'Y'
 ? 'rotateY(180deg)'
 : 'rotateX(180deg)'
 : 'rotateY(0deg)';
 announce(flipped ? 'Showing reverse side.' : 'Showing front side.');
 };

 const handleClick = () => {
 if (!flipOnClick) return;
 toggleFlip();
 };

 const handleKeyDown = (event: KeyboardEvent) => {
 if (event.key === 'Enter' || event.key === ' ') {
 event.preventDefault();
 toggleFlip();
 }
 };

 root.addEventListener('click', handleClick);
 root.addEventListener('keydown', handleKeyDown);
 root.addEventListener('blur', () => {
 if (flipOnClick && flipped) {
 toggleFlip();
 }
 });

 return () => {
 root.removeEventListener('click', handleClick);
 root.removeEventListener('keydown', handleKeyDown);
 };
 }, [rootId, innerId, liveRegionId, flipOnClick]);

 return null;
}
