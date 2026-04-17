import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Briefcase,
  CreditCard,
  FileText,
  Heart,
  CalendarDays,
  Mail,
  Menu,
  MessageSquare,
  Package,
  ShoppingCart,
  Ticket,
  User,
} from 'lucide-react';

export type SystemExperience = {
  description: string;
  href: string;
  icon: LucideIcon;
  title: string;
};

export const systemExperiences: SystemExperience[] = [
  {
    description: 'Layout, filters, search cho danh sách bài viết.',
    href: '/system/experiences/posts-list',
    icon: FileText,
    title: 'Danh sách bài viết',
  },
  {
    description: 'Layout, author info, comments cho chi tiết bài viết.',
    href: '/system/experiences/posts-detail',
    icon: FileText,
    title: 'Chi tiết bài viết',
  },
  {
    description: 'Layout, filters, search cho danh sách dịch vụ.',
    href: '/system/experiences/services-list',
    icon: Briefcase,
    title: 'Danh sách dịch vụ',
  },
  {
    description: 'Form đặt lịch, lịch trống và hiển thị public.',
    href: '/system/experiences/booking',
    icon: CalendarDays,
    title: 'Đặt lịch',
  },
  {
    description: 'Layout, author info, comments cho chi tiết dịch vụ.',
    href: '/system/experiences/services-detail',
    icon: Briefcase,
    title: 'Chi tiết dịch vụ',
  },
  {
    description: 'Layout, filters, search cho danh sách sản phẩm.',
    href: '/system/experiences/products-list',
    icon: Package,
    title: 'Danh sách sản phẩm',
  },
  {
    description: 'Layout, rating, wishlist, giỏ hàng cho chi tiết sản phẩm.',
    href: '/system/experiences/product-detail',
    icon: Package,
    title: 'Chi tiết sản phẩm',
  },
  {
    description: 'Style header, topbar, search, cart, wishlist, login.',
    href: '/system/experiences/menu',
    icon: Menu,
    title: 'Header Menu',
  },
  {
    description: 'Layout trang wishlist, nút wishlist, note và notification.',
    href: '/system/experiences/wishlist',
    icon: Heart,
    title: 'Sản phẩm yêu thích',
  },
  {
    description: 'Accordion đơn hàng, thống kê, tracking cho account.',
    href: '/system/experiences/account-orders',
    icon: Package,
    title: 'Đơn hàng (Account)',
  },
  {
    description: 'Profile, quick actions và thông tin liên hệ.',
    href: '/system/experiences/account-profile',
    icon: User,
    title: 'Tài khoản (Account)',
  },
  {
    description: 'Layout giỏ hàng (drawer/page), guest cart, expiry và note.',
    href: '/system/experiences/cart',
    icon: ShoppingCart,
    title: 'Giỏ hàng',
  },
  {
    description: 'Checkout flow, payment methods, shipping và order summary.',
    href: '/system/experiences/checkout',
    icon: CreditCard,
    title: 'Thanh toán & Đặt hàng',
  },
  {
    description: 'Rating display, sort order, likes, replies và moderation.',
    href: '/system/experiences/comments-rating',
    icon: MessageSquare,
    title: 'Bình luận & Đánh giá',
  },
  {
    description: 'Layout form liên hệ, map, contact info và social links.',
    href: '/system/experiences/contact',
    icon: Mail,
    title: 'Trang liên hệ',
  },
  {
    description: 'Trang lỗi tổng hợp 400-504, CTA và màu thương hiệu.',
    href: '/system/experiences/error-pages',
    icon: AlertTriangle,
    title: 'Trang lỗi hệ thống',
  },
  {
    description: 'Danh sách voucher, chương trình khuyến mãi và countdown.',
    href: '/system/experiences/promotions-list',
    icon: Ticket,
    title: 'Khuyến mãi',
  },
];
