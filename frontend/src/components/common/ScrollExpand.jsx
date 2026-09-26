import { useCallback, useEffect, useRef } from 'react';

import './ScrollExpand.css';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

const ScrollExpand = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  scrollHint = '',
  startWidth = 60,
  startHeight = 65,
  startRadius = 28,
  endRadius = 0,
  mediaZoom = 1.18,
  scrollDistance = 0.7,
  holdDistance = 0.25,
  smoothing = 0,
  overlayScrim = 0.7,
  useWindowScroll = false,
  enabled = true,
  expandOnHover = false,
  children,
  className = '',
  style,
  ...rest
}) => {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const mediaRef = useRef(null);
  const titleRef = useRef(null);
  const overlayRef = useRef(null);
  const scrimRef = useRef(null);
  const hintRef = useRef(null);

  const propsRef = useRef({});
  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
    expandOnHover
  };

  const applyProgress = useCallback(p => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    const isMob = typeof window !== 'undefined' && window.innerWidth < 768;
    const sW = c.useWindowScroll && isMob ? Math.max(c.startWidth, 88) : c.startWidth;
    const sH = c.useWindowScroll && isMob ? Math.max(c.startHeight, 68) : c.startHeight;
    const sR = isMob ? Math.min(c.startRadius, 20) : c.startRadius;

    // --- GIAI ĐOẠN 1: ZOOM ẢNH RA ĐỦ TOÀN MÀN HÌNH (0.0 -> 0.45) ---
    // Trong khoảng 0 -> 0.45, khung ảnh bung mở ra 100% full-screen, chữ chưa xuất hiện
    const zoomEnd = 0.45;
    const zoomP = smoothstep(0, zoomEnd, p);

    const w = sW + (100 - sW) * zoomP;
    const h = sH + (100 - sH) * zoomP;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = sR + (c.endRadius - sR) * zoomP;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * zoomP}) translate3d(0, 0, 0)`;

    // Scrim nền tối phủ lên khi ảnh đã bung mở để làm nổi bật khối chữ
    if (scrimRef.current) {
      const scrimP = smoothstep(0.35, 0.65, p);
      scrimRef.current.style.opacity = `${c.overlayScrim * scrimP}`;
    }

    // Tiêu đề gợi ý ban đầu mờ dần và bay lên khi ảnh bắt đầu zoom
    if (titleRef.current) {
      const out = smoothstep(0.05, 0.35, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-24 * out}px, 0)`;
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.15, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${10 * gone}px, 0)`;
    }

    // --- GIAI ĐOẠN 2 & 3: KHI ẢNH ĐÃ ZOOM XONG, NỘI DUNG TỪ DƯỚI ĐI VÀO THEO LĂN CHUỘT RỒI GIỮ YÊN ĐỂ ĐỌC ---
    // Từ 0.44 -> 0.68: Nội dung trượt dứt khoát từ dưới lên theo nhịp lăn chuột (translateY: 90px -> 0px)
    // Từ 0.68 -> 1.00: Nội dung dừng vững vàng ở vị trí hoàn hảo, giữ cố định cho người xem đọc dễ dàng
    if (overlayRef.current) {
      const textStart = 0.44;
      const textEnd = 0.68;
      const textP = smoothstep(textStart, textEnd, p);
      const translateY = (1 - textP) * 90;
      overlayRef.current.style.opacity = `${textP}`;
      overlayRef.current.style.transform = `translate3d(0, ${translateY}px, 0)`;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;
    let isHovered = false;

    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || window.innerWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.05, 18, 44)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      if (isHovered && !c.useWindowScroll) return 1;
      const totalSpan = stageH * Math.max(0.01, c.scrollDistance + c.holdDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / totalSpan, 0, 1);
      }
      return clamp(root.scrollTop / totalSpan, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    const onMouseEnter = () => {
      if (!propsRef.current.expandOnHover || propsRef.current.useWindowScroll) return;
      isHovered = true;
      target = 1;
      kick();
    };

    const onMouseLeave = () => {
      if (!propsRef.current.expandOnHover || propsRef.current.useWindowScroll) return;
      isHovered = false;
      target = readProgress();
      kick();
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    if (expandOnHover && !useWindowScroll) {
      root.addEventListener('mouseenter', onMouseEnter);
      root.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      if (expandOnHover && !useWindowScroll) {
        root.removeEventListener('mouseenter', onMouseEnter);
        root.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [applyProgress, useWindowScroll, expandOnHover]);

  const media =
    mediaType === 'video' ? (
      <video
        ref={mediaRef}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <img ref={mediaRef} className="scroll-expand__media" src={src} alt={alt} draggable={false} />
    );

  return (
    <div
      ref={rootRef}
      className={`scroll-expand ${useWindowScroll ? '' : 'scroll-expand--scroller'} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {media}
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children ? (
              <div ref={overlayRef} className="scroll-expand__overlay">
                {children}
              </div>
            ) : null}
          </div>
          {title ? (
            <div ref={titleRef} className="scroll-expand__title">
              {title}
            </div>
          ) : null}
          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint">
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;
