import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CartView from "./CartView";

export const metadata = {
  title: "Your Cart · ePassyar",
};

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <CartView />
      <SiteFooter />
    </>
  );
}
