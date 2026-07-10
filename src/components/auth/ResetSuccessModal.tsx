import { AuthNav } from "@/pages/Auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import resetSuccessIllustration from "@/assets/auth/reset-success-illustration.png";

export function ResetSuccessModal({ nav }: { nav: AuthNav }) {
  const backToLogin = () => {
    nav.closeModal();
    nav.goTo("login");
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) backToLogin();
      }}
    >
      <DialogContent className="max-w-[520px] gap-4 rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          <img
            src={resetSuccessIllustration}
            alt=""
            className="h-[157px] w-auto"
          />
          <div className="flex flex-col items-center gap-1 text-center">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Successful password reset !
            </DialogTitle>
            <DialogDescription className="max-w-[305px] text-sm text-muted-foreground">
              You can now use your new password to login to your account.
            </DialogDescription>
          </div>
          <Button type="button" onClick={backToLogin} className="h-10 w-full rounded-lg">
            Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
