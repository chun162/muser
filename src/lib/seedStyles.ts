import type { GenParams, Style } from '../types'

// 画风库内置种子 — 遵循 docs/specs/02-画风库模块.md
// 全部为「自有沉淀」：风格命名与 prompt 模板由本项目原创撰写，不复制对标文案/素材。
// 分类覆盖 2D / 3D / 写实，内置 ≥ 20。

const DEFAULT_PARAMS: GenParams = {
  resolution: '1024x1024',
  steps: 30,
  sampler: 'dpmpp_2m',
  negativePrompt: '',
  batch: 1,
}

function mk(
  id: string,
  name: string,
  category: Style['category'],
  promptTemplate: string,
  params?: Partial<GenParams>,
): Style {
  return {
    id,
    name,
    category,
    promptTemplate,
    params: { ...DEFAULT_PARAMS, ...params },
    builtin: true,
  }
}

export const BUILTIN_STYLES: Style[] = [
  // ===== 2D =====
  mk('b-hefeng', '和风动漫', '2d', 'anime style, clean cel shading, vibrant colors, Japanese animation aesthetic, {prompt}'),
  mk('b-classic', '经典手绘', '2d', 'classic hand-drawn 2D animation, flat colors, soft watercolor background, Disney-Pixar feel, {prompt}'),
  mk('b-shuimo', '国风水墨', '2d', 'traditional Chinese ink wash painting, fine brush lines, rice paper texture, elegant negative space, {prompt}'),
  mk('b-webtoon', '韩系条漫', '2d', 'Korean webtoon style, clean digital linework, soft layered coloring, pastel gradient, {prompt}'),
  mk('b-urban', '都市言情', '2d', 'modern urban romance comic, delicate glossy shading, warm city lighting, fashionable characters, {prompt}'),
  mk('b-guofeng', '国风彩漫', '2d', 'Chinese color comic, ink meets painting, ornate costumes, flowing lines, oriental fantasy, {prompt}'),
  mk('b-thriller', '暗黑惊悚', '2d', 'horror comic, high-contrast ink, eerie shadows, gritty hatching, low saturation, {prompt}'),
  mk('b-american', '美漫硬派', '2d', 'American comic style, bold black outlines, dynamic poses, halftone shading, high saturation, {prompt}'),
  mk('b-retro', '复古海报', '2d', 'retro poster illustration, low-saturation nostalgic palette, grainy texture, old-print vibe, {prompt}'),
  mk('b-child', '童趣绘卷', '2d', 'children picture book, soft watercolor, round cute shapes, warm cheerful palette, {prompt}'),
  mk('b-xianxia', '仙侠幻境', '2d', 'xianxia fantasy, flowing hanfu, spirit light effects, ethereal immortal realm, dreamy, {prompt}'),

  // ===== 3D =====
  mk('b-cinematic3d', '影院CG', '3d', 'cinematic 3D CGI, Pixar-DreamWorks style, subsurface scattering, PBR materials, volumetrics, {prompt}'),
  mk('b-cyber', '赛博霓虹', '3d', 'cyberpunk future city, neon lights, wet reflective streets, holographic displays, {prompt}'),
  mk('b-guofeng3d', '国风幻境3D', '3d', 'Chinese fantasy 3D render, intricate ancient architecture and costumes, cinematic volumetrics, {prompt}'),
  mk('b-epic', '史诗奇幻', '3d', 'epic fantasy 3D, grand cinematic scale, detailed armor and creatures, dramatic god rays, {prompt}', { steps: 40 }),
  mk('b-toon3d', '潮流卡通3D', '3d', 'modern 3D toon, cel-shaded characters, vivid colors, clean stylized models, {prompt}'),
  mk('b-game3d', '游戏仙侠3D', '3d', 'game xianxia 3D, MMORPG cinematic quality, gorgeous immortal costumes, glowing spell FX, {prompt}', { steps: 40 }),

  // ===== 写实 =====
  mk('b-realistic', '真人电影', 'realistic', 'photorealistic, real photography, natural light, 8K, shallow depth of field, {prompt}'),
  mk('b-guoshi', '国风纪实', 'realistic', 'realistic Chinese historical, authentic costumes and architecture, cinematic natural light, {prompt}'),
  mk('b-survival', '荒野求生', 'realistic', 'hardcore survival realism, weathered textures, harsh natural light, earth tones, documentary, {prompt}'),
  mk('b-rural', '乡野时光', 'realistic', 'rustic realism, natural daylight, simple village scenery, warm earth tones, documentary, {prompt}'),
  mk('b-tang', '盛世华庭', 'realistic', 'realistic Tang dynasty grandeur, luxurious court costumes and halls, golden cinematic light, {prompt}'),
  mk('b-future', '未来都市', 'realistic', 'realistic future city, sleek high-tech scenes, sci-fi cinematic lighting, refined materials, {prompt}'),
]
