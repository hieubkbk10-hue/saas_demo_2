import type { MutationCtx, QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { slugify } from '../lib/image/uploadNaming';
import { TRUST_PAGE_SLOTS, type TrustPageKey } from '../lib/ia/trust-pages';
import * as PostCategoriesModel from './model/postCategories';
import * as PostsModel from './model/posts';

type SettingsMap = Map<string, unknown>;

const TRUST_PAGE_ACTIONS = ['disabled', 'mapped', 'suggested', 'draft'] as const;
type TrustPageAction = (typeof TRUST_PAGE_ACTIONS)[number];

const IA_GROUP = 'ia';

const resolveBoolean = (value: unknown, fallback = true) =>
  typeof value === 'boolean' ? value : fallback;

const resolveString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const resolvePostId = (value: unknown) =>
  typeof value === 'string' && value.trim() ? (value.trim() as Id<'posts'>) : null;

const toSearchable = (value?: string | null) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/đ/g, 'd');

const buildSettingsMap = async (ctx: QueryCtx | MutationCtx) => {
  const settings = await ctx.db.query('settings').take(500);
  return new Map(settings.map((setting: { key: string; value: unknown }) => [setting.key, setting.value]));
};

const getPolicyCategory = async (
  ctx: QueryCtx | MutationCtx,
  createIfMissing: boolean,
): Promise<{ id: Id<'postCategories'>; name: string; slug: string } | null> => {
  const categories = await ctx.db.query('postCategories').take(200);
  const normalized = categories.map((category: { _id: Id<'postCategories'>; name: string; slug: string }) => ({
    id: category._id,
    name: category.name,
    slug: category.slug,
    searchable: toSearchable(`${category.name} ${category.slug}`),
  }));
  const found = normalized.find((category) =>
    category.searchable.includes('chinh sach') || category.searchable.includes('policy')
  );
  if (found) {
    return { id: found.id, name: found.name, slug: found.slug };
  }
  if (!createIfMissing) {
    return null;
  }
  const name = 'Chính sách';
  const slug = slugify(name);
  const id = await PostCategoriesModel.create(ctx as MutationCtx, { name, slug, active: true });
  return { id, name, slug };
};

const findMatchingPost = (
  posts: { _id: Id<'posts'>; title: string; slug: string; status: string }[],
  slot: (typeof TRUST_PAGE_SLOTS)[number],
) => {
  const keywords = slot.keywords.map(toSearchable);
  return posts.find((post) => {
    const target = toSearchable(`${post.title} ${post.slug}`);
    return keywords.some((keyword) => target.includes(keyword));
  });
};

const buildDraftPayload = (
  slot: (typeof TRUST_PAGE_SLOTS)[number],
  settingsMap: SettingsMap,
  categoryName?: string,
) => {
  const siteName = resolveString(settingsMap.get('site_name')) ?? 'Website';
  const siteUrl = resolveString(settingsMap.get('site_url')) ?? '';
  const email = resolveString(settingsMap.get('contact_email')) ?? 'support@example.com';
  const phone = resolveString(settingsMap.get('contact_phone')) ?? '';
  const address = resolveString(settingsMap.get('contact_address')) ?? '';
  const policyLabel = slot.defaultTitle;
  const excerpt = `${policyLabel} áp dụng cho khách hàng mua sắm tại ${siteName}, giúp minh bạch quyền lợi và trách nhiệm đôi bên.`;
  const contactLine = [email, phone && `Hotline: ${phone}`, address && `Địa chỉ: ${address}`]
    .filter(Boolean)
    .join(' · ');
  const resolvedContact = contactLine || 'Thông tin liên hệ sẽ được cập nhật sớm.';
  const emphasize = (text: string, keywords: string[]) =>
    keywords.reduce((acc, keyword) => acc.replaceAll(keyword, `<strong>${keyword}</strong>`), text);
  const baseKeywords = [siteName, policyLabel, 'liên hệ', 'hỗ trợ'];
  const slotKeywords: Record<TrustPageKey, string[]> = {
    privacy: ['bảo mật', 'dữ liệu', 'thông tin', 'khách hàng'],
    returnPolicy: ['đổi trả', 'hoàn tiền', 'điều kiện', 'quy trình'],
    shipping: ['vận chuyển', 'giao hàng', 'thời gian', 'phí'],
    payment: ['thanh toán', 'chuyển khoản', 'COD', 'xác nhận'],
    terms: ['điều khoản', 'trách nhiệm', 'khiếu nại', 'tranh chấp'],
    about: ['giới thiệu', 'cam kết', 'dịch vụ', 'giá trị'],
    faq: ['câu hỏi', 'thường gặp', 'đơn hàng', 'liên hệ'],
  };
  const keywords = [...baseKeywords, ...(slotKeywords[slot.key] ?? [])];

  const sections: {
    title: string;
    paragraphs?: string[];
    items?: string[];
    qa?: { q: string; a: string }[];
    listType?: 'ul' | 'ol';
    callout?: string;
  }[] = [];

  if (slot.key === 'privacy') {
    sections.push(
      {
        title: 'Tổng quan',
        paragraphs: [
          `${siteName} tôn trọng và cam kết bảo vệ dữ liệu cá nhân của khách hàng.`,
          'Chính sách này mô tả loại dữ liệu thu thập, mục đích sử dụng và quyền của khách hàng.',
        ],
      },
      {
        title: 'Dữ liệu thu thập',
        items: [
          'Thông tin liên hệ: họ tên, email, số điện thoại, địa chỉ nhận hàng.',
          'Thông tin giao dịch: sản phẩm đã mua, lịch sử đơn hàng, yêu cầu hỗ trợ.',
          'Thông tin kỹ thuật: IP, thiết bị, trình duyệt, cookies phục vụ trải nghiệm.',
        ],
      },
      {
        title: 'Mục đích sử dụng',
        items: [
          'Xử lý đơn hàng, giao hàng và chăm sóc sau mua.',
          'Cải thiện trải nghiệm mua sắm, gợi ý sản phẩm phù hợp.',
          'Gửi thông báo đơn hàng và ưu đãi (khi khách hàng đồng ý).',
        ],
      },
      {
        title: 'Chia sẻ dữ liệu',
        items: [
          'Chỉ chia sẻ cho đối tác vận chuyển/thanh toán để hoàn tất đơn hàng.',
          'Không bán dữ liệu cho bên thứ ba khi chưa có sự đồng ý.',
          'Tuân thủ yêu cầu pháp lý khi cơ quan có thẩm quyền yêu cầu.',
        ],
      },
      {
        title: 'Lưu trữ và bảo mật',
        items: [
          'Dữ liệu được lưu trữ theo thời gian cần thiết cho mục đích hợp lệ.',
          'Áp dụng biện pháp kỹ thuật và quy trình nội bộ để bảo vệ dữ liệu.',
          'Giới hạn quyền truy cập dữ liệu theo vai trò.',
        ],
      },
      {
        title: 'Quyền của khách hàng',
        items: [
          'Yêu cầu xem, chỉnh sửa hoặc xoá dữ liệu cá nhân hợp lệ.',
          'Từ chối nhận thông tin quảng cáo bất kỳ lúc nào.',
          'Phản hồi khi có nghi ngờ lộ lọt dữ liệu.',
        ],
      },
      {
        title: 'Liên hệ',
        paragraphs: [resolvedContact],
      },
    );
  }

  if (slot.key === 'returnPolicy') {
    sections.push(
      {
        title: 'Tổng quan',
        paragraphs: [
          `Chính sách đổi trả của ${siteName} giúp khách hàng yên tâm khi mua sắm.`,
          'Sản phẩm đủ điều kiện đổi trả theo quy định dưới đây.',
        ],
      },
      {
        title: 'Điều kiện đổi trả',
        items: [
          'Sản phẩm còn nguyên tem, nhãn, bao bì và chưa qua sử dụng.',
          'Có hoá đơn/biên nhận hoặc mã đơn hàng hợp lệ.',
          'Thời hạn yêu cầu đổi trả: 7–30 ngày tuỳ nhóm sản phẩm.',
        ],
      },
      {
        title: 'Trường hợp không hỗ trợ',
        items: [
          'Sản phẩm hư hỏng do lỗi sử dụng hoặc bảo quản sai.',
          'Sản phẩm thuộc nhóm hạn chế đổi trả (nếu có thông báo riêng).',
        ],
      },
      {
        title: 'Quy trình đổi trả',
        listType: 'ol',
        items: [
          `Liên hệ ${email}${phone ? ` hoặc ${phone}` : ''} để tạo yêu cầu.`,
          'Nhận hướng dẫn đóng gói và địa chỉ nhận hàng đổi trả.',
          'Kiểm tra sản phẩm và phản hồi kết quả trong 1–3 ngày làm việc.',
        ],
      },
      {
        title: 'Hoàn tiền',
        items: [
          'Hoàn tiền theo phương thức thanh toán ban đầu.',
          'Thời gian hoàn tiền 3–10 ngày làm việc tuỳ ngân hàng/đơn vị.',
        ],
      },
      {
        title: 'Liên hệ hỗ trợ',
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'shipping') {
    sections.push(
      {
        title: 'Phạm vi giao hàng',
        items: [
          'Giao hàng toàn quốc thông qua đối tác vận chuyển uy tín.',
          'Một số khu vực có thể áp dụng thời gian giao hàng dài hơn.',
        ],
      },
      {
        title: 'Thời gian xử lý đơn',
        listType: 'ol',
        items: [
          'Đơn hàng được xác nhận trong 24 giờ làm việc.',
          'Đóng gói và bàn giao vận chuyển trong 1–2 ngày làm việc.',
        ],
      },
      {
        title: 'Thời gian giao hàng dự kiến',
        items: ['Nội thành: 1–2 ngày', 'Ngoại thành/tỉnh: 3–5 ngày'],
      },
      {
        title: 'Phí vận chuyển',
        items: [
          'Phí được hiển thị rõ ràng tại bước thanh toán.',
          'Miễn phí/ưu đãi vận chuyển theo chương trình từng thời điểm.',
        ],
      },
      {
        title: 'Theo dõi đơn hàng',
        items: [
          'Cập nhật trạng thái qua email/SMS hoặc trang theo dõi đơn.',
          siteUrl ? `Truy cập ${siteUrl} để kiểm tra trạng thái.` : 'Liên hệ hỗ trợ nếu cần tra cứu.',
        ],
      },
      {
        title: 'Liên hệ hỗ trợ',
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'payment') {
    sections.push(
      {
        title: 'Hình thức thanh toán',
        items: [
          'Thanh toán khi nhận hàng (COD).',
          'Chuyển khoản ngân hàng.',
          'Ví điện tử hoặc thẻ quốc tế (nếu có hỗ trợ).',
        ],
      },
      {
        title: 'Xác nhận thanh toán',
        listType: 'ol',
        items: [
          `Gửi thông tin thanh toán về ${email} để xác minh nhanh.`,
          'Đơn hàng sẽ được xác nhận trong 24 giờ làm việc.',
        ],
      },
      {
        title: 'An toàn giao dịch',
        items: [
          'Thông tin thanh toán được bảo mật theo tiêu chuẩn hiện hành.',
          'Khuyến nghị khách hàng không chia sẻ mã OTP cho bất kỳ ai.',
        ],
      },
      {
        title: 'Xuất hoá đơn',
        items: [
          'Hỗ trợ xuất hoá đơn theo yêu cầu (nếu khách hàng cung cấp thông tin).',
          'Vui lòng liên hệ bộ phận hỗ trợ để được hướng dẫn.',
        ],
      },
      {
        title: 'Liên hệ hỗ trợ',
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'terms') {
    sections.push(
      {
        title: 'Chấp nhận điều khoản',
        paragraphs: [
          `Khi truy cập và mua sắm tại ${siteName}, khách hàng đồng ý với các điều khoản dưới đây.`,
          'Chúng tôi có quyền cập nhật điều khoản để phù hợp quy định pháp luật và hoạt động kinh doanh.',
        ],
      },
      {
        title: 'Trách nhiệm của khách hàng',
        items: [
          'Cung cấp thông tin chính xác khi đặt hàng.',
          'Kiểm tra hàng hóa khi nhận và phản hồi kịp thời.',
          'Không sử dụng nội dung/nhãn hiệu của website khi chưa được phép.',
        ],
      },
      {
        title: 'Trách nhiệm của chúng tôi',
        items: [
          'Cung cấp thông tin sản phẩm minh bạch và cập nhật.',
          'Bảo mật thông tin khách hàng theo chính sách bảo mật.',
          'Xử lý khiếu nại theo quy trình công khai.',
        ],
      },
      {
        title: 'Hủy đơn và hoàn tiền',
        items: [
          'Khách hàng có thể hủy đơn trước khi đơn được bàn giao vận chuyển.',
          'Hoàn tiền theo chính sách đổi trả hiện hành.',
        ],
      },
      {
        title: 'Giới hạn trách nhiệm',
        items: [
          'Chúng tôi không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh ngoài phạm vi kiểm soát.',
          'Mọi tranh chấp sẽ ưu tiên giải quyết bằng thương lượng thiện chí.',
        ],
      },
      {
        title: 'Liên hệ',
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'about') {
    sections.push(
      {
        title: 'Giới thiệu',
        paragraphs: [
          `${siteName} là nền tảng mua sắm trực tuyến tập trung vào trải nghiệm an toàn, minh bạch và tối ưu.`,
          'Chúng tôi lựa chọn sản phẩm kỹ càng, ưu tiên chất lượng và nguồn gốc rõ ràng.',
        ],
      },
      {
        title: 'Giá trị cốt lõi',
        items: [
          'Minh bạch thông tin và giá bán.',
          'Dịch vụ khách hàng tận tâm.',
          'Chất lượng sản phẩm là ưu tiên số một.',
        ],
      },
      {
        title: 'Dịch vụ & cam kết',
        items: [
          'Tư vấn trước mua và hỗ trợ sau mua.',
          'Giao hàng nhanh, đổi trả rõ ràng.',
          'Bảo mật dữ liệu khách hàng.',
        ],
      },
      {
        title: 'Thông tin liên hệ',
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'faq') {
    sections.push(
      {
        title: 'Câu hỏi thường gặp',
        qa: [
          { q: 'Làm sao để đặt hàng?', a: 'Chọn sản phẩm, thêm vào giỏ và hoàn tất thanh toán theo hướng dẫn.' },
          { q: 'Bao lâu thì đơn hàng được giao?', a: 'Thời gian giao hàng dự kiến 1–5 ngày làm việc tuỳ khu vực.' },
          { q: 'Tôi có thể đổi trả không?', a: 'Có. Vui lòng tham khảo Chính sách đổi trả hoặc liên hệ hỗ trợ.' },
          { q: 'Tôi muốn xuất hoá đơn?', a: 'Vui lòng cung cấp thông tin xuất hoá đơn khi đặt hàng hoặc liên hệ hỗ trợ.' },
          { q: 'Cách liên hệ hỗ trợ nhanh?', a: resolvedContact },
        ],
      },
    );
  }

  const htmlBody = `
    <h1 style="text-align:center;">${policyLabel}</h1>
    <p style="text-align:center;">Áp dụng tại ${emphasize(siteName, keywords)} · Cập nhật định kỳ để đảm bảo minh bạch</p>
    <p>${emphasize(excerpt, keywords)}</p>
    <hr />
    ${sections
      .map((section) => {
        const paragraphs = section.paragraphs?.map((p) => `<p>${emphasize(p, keywords)}</p>`).join('') ?? '';
        const listTag = section.listType ?? 'ul';
        const items = section.items?.length
          ? `<${listTag}>${section.items.map((item) => `<li>${emphasize(item, keywords)}</li>`).join('')}</${listTag}>`
          : '';
        const callout = section.callout
          ? `<blockquote><strong>Liên hệ nhanh:</strong> ${emphasize(section.callout, keywords)}</blockquote>`
          : '';
        const qa = section.qa?.length
          ? section.qa
            .map((item) => `<h3>${emphasize(item.q, keywords)}</h3><p>${emphasize(item.a, keywords)}</p>`)
            .join('')
          : '';
        const title = section.title
          .replaceAll(siteName, `<strong>${siteName}</strong>`)
          .replaceAll(policyLabel, `<strong>${policyLabel}</strong>`);
        return `<h2>${title}</h2>${paragraphs}${items}${qa}${callout}`;
      })
      .join('')}
    ${siteUrl ? `<p style="text-align:right;">Website: <a href="${siteUrl}">${siteUrl}</a></p>` : ''}
    ${categoryName ? `<p style="text-align:right;">Danh mục: <strong>${categoryName}</strong></p>` : ''}
  `.trim();

  return {
    title: policyLabel,
    slug: `policy-${slugify(policyLabel)}`,
    excerpt,
    metaTitle: `${policyLabel} | ${siteName}`,
    metaDescription: excerpt,
    content: htmlBody,
  };
};

const buildAutoGeneratePlan = async (ctx: QueryCtx | MutationCtx) => {
  const settingsMap = await buildSettingsMap(ctx);
  const policyCategory = await getPolicyCategory(ctx, false);
  const posts = policyCategory
    ? await PostsModel.listByCategory(ctx, { categoryId: policyCategory.id, limit: 200 })
    : await PostsModel.listWithLimit(ctx, { limit: 200 });

  const slots = TRUST_PAGE_SLOTS.map((slot) => {
    const enabled = resolveBoolean(settingsMap.get(slot.iaKey), true);
    const mappedPostId = resolvePostId(settingsMap.get(slot.mappingKey));
    if (!enabled) {
      return { action: 'disabled' as TrustPageAction, enabled, slot };
    }
    if (mappedPostId) {
      const post = posts.find((item) => item._id === mappedPostId);
      if (post) {
        return {
          action: 'mapped' as TrustPageAction,
          enabled,
          slot,
          postId: mappedPostId,
          postTitle: post.title,
          postStatus: post.status,
        };
      }
      const payload = buildDraftPayload(slot, settingsMap, policyCategory?.name);
      return {
        action: 'draft' as TrustPageAction,
        enabled,
        slot,
        payload,
      };
    }

    const matched = findMatchingPost(posts, slot);
    if (matched) {
      return {
        action: 'suggested' as TrustPageAction,
        enabled,
        slot,
        postId: matched._id,
        postTitle: matched.title,
        postStatus: matched.status,
      };
    }

    const payload = buildDraftPayload(slot, settingsMap, policyCategory?.name);
    return {
      action: 'draft' as TrustPageAction,
      enabled,
      slot,
      payload,
    };
  });

  return {
    policyCategory,
    settingsMap,
    slots,
  };
};

const ensureFeatureEnabled = async (ctx: QueryCtx | MutationCtx) => {
  const feature = await ctx.db
    .query('moduleFeatures')
    .withIndex('by_module_feature', (q) => q.eq('moduleKey', 'settings').eq('featureKey', 'enableTrustPagesAutoGenerate'))
    .unique();
  if (!feature?.enabled) {
    throw new Error('Tính năng tự sinh Trust Pages đang tắt');
  }
};

export const previewAutoGenerate = query({
  args: {},
  handler: async (ctx) => {
    await ensureFeatureEnabled(ctx);
    const plan = await buildAutoGeneratePlan(ctx);
    return {
      policyCategory: plan.policyCategory ?? undefined,
      slots: plan.slots.map((slot) => ({
        key: slot.slot.key,
        label: slot.slot.label,
        slug: slot.slot.slug,
        action: slot.action,
        enabled: slot.enabled,
        postId: slot.postId ?? null,
        postTitle: slot.postTitle ?? null,
        postStatus: slot.postStatus ?? null,
      })),
    };
  },
  returns: v.object({
    policyCategory: v.optional(v.object({ id: v.id('postCategories'), name: v.string(), slug: v.string() })),
    slots: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        slug: v.string(),
        action: v.union(
          v.literal('disabled'),
          v.literal('mapped'),
          v.literal('suggested'),
          v.literal('draft'),
        ),
        enabled: v.boolean(),
        postId: v.union(v.id('posts'), v.null()),
        postTitle: v.union(v.string(), v.null()),
        postStatus: v.union(v.string(), v.null()),
      })
    ),
  }),
});

export const applyAutoGenerate = mutation({
  args: { overwrite: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await ensureFeatureEnabled(ctx);
    const plan = await buildAutoGeneratePlan(ctx);
    const overwrite = args.overwrite === true;
    const policyCategory = plan.policyCategory ?? (await getPolicyCategory(ctx, true));
    if (!policyCategory) {
      throw new Error('Không thể tạo danh mục chính sách');
    }

    const settings = await ctx.db.query('settings').take(500);
    const settingsMap = new Map(settings.map((setting: { key: string }) => [setting.key, setting]));
    const updates: { key: string; value: unknown }[] = [];
    const results: {
      key: string;
      action: TrustPageAction;
      postId?: Id<'posts'> | null;
      postTitle?: string | null;
      postStatus?: string | null;
    }[] = [];

    if (overwrite) {
      const existingPosts = await PostsModel.listByCategory(ctx, { categoryId: policyCategory.id, limit: 1000 });
      for (const post of existingPosts) {
        await PostsModel.remove(ctx, { cascade: true, id: post._id });
      }
    }

    for (const slot of plan.slots) {
      if (!slot.enabled) {
        results.push({ key: slot.slot.key, action: 'disabled' });
        if (overwrite) {
          updates.push({ key: slot.slot.mappingKey, value: null });
        }
        continue;
      }

      if (overwrite) {
        const payload = buildDraftPayload(slot.slot, plan.settingsMap, policyCategory.name);
        const status = slot.postStatus && ['Published', 'Draft', 'Archived'].includes(slot.postStatus)
          ? slot.postStatus
          : 'Draft';
        const postId = await PostsModel.create(ctx, {
          title: payload.title,
          slug: payload.slug,
          content: payload.content,
          renderType: 'content',
          excerpt: payload.excerpt,
          metaTitle: payload.metaTitle,
          metaDescription: payload.metaDescription,
          categoryId: policyCategory.id,
          status: status as 'Draft' | 'Published' | 'Archived',
          publishImmediately: status === 'Published',
        });
        updates.push({ key: slot.slot.mappingKey, value: postId });
        results.push({
          key: slot.slot.key,
          action: 'draft',
          postId,
          postTitle: payload.title,
          postStatus: status,
        });
        continue;
      }

      if (slot.action === 'mapped' || slot.action === 'suggested') {
        updates.push({ key: slot.slot.mappingKey, value: slot.postId ?? null });
        results.push({
          key: slot.slot.key,
          action: slot.action,
          postId: slot.postId ?? null,
          postTitle: slot.postTitle ?? null,
          postStatus: slot.postStatus ?? null,
        });
        continue;
      }

      if (slot.action === 'draft' && slot.payload) {
        const postId = await PostsModel.create(ctx, {
          title: slot.payload.title,
          slug: slot.payload.slug,
          content: slot.payload.content,
          renderType: 'content',
          excerpt: slot.payload.excerpt,
          metaTitle: slot.payload.metaTitle,
          metaDescription: slot.payload.metaDescription,
          categoryId: policyCategory.id,
          status: 'Draft',
        });
        updates.push({ key: slot.slot.mappingKey, value: postId });
        results.push({
          key: slot.slot.key,
          action: slot.action,
          postId,
          postTitle: slot.payload.title,
          postStatus: 'Draft',
        });
      }
    }

    updates.push({ key: 'trust_page_last_autogen_at', value: Date.now() });

    for (const update of updates) {
      const existing = settingsMap.get(update.key) as { _id: Id<'settings'> } | undefined;
      if (existing) {
        await ctx.db.patch(existing._id, { group: IA_GROUP, value: update.value });
      } else {
        await ctx.db.insert('settings', { group: IA_GROUP, key: update.key, value: update.value });
      }
    }

    return {
      policyCategory,
      results,
      updatedSettings: updates.reduce<Record<string, unknown>>((acc, update) => {
        acc[update.key] = update.value;
        return acc;
      }, {}),
    };
  },
  returns: v.object({
    policyCategory: v.object({ id: v.id('postCategories'), name: v.string(), slug: v.string() }),
    results: v.array(
      v.object({
        key: v.string(),
        action: v.union(
          v.literal('disabled'),
          v.literal('mapped'),
          v.literal('suggested'),
          v.literal('draft'),
        ),
        postId: v.optional(v.union(v.id('posts'), v.null())),
        postTitle: v.optional(v.union(v.string(), v.null())),
        postStatus: v.optional(v.union(v.string(), v.null())),
      })
    ),
    updatedSettings: v.record(v.string(), v.any()),
  }),
});
