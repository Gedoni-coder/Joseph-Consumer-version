declare module "@mono.co/connect.js" {
  export default class Connect {
    constructor(config: {
      key: string;
      scope: "auth";
      reference: string;
      data: {
        customer: { name: string; email: string };
        meta: { ref: string };
      };
      onSuccess: (data: { code: string }) => void;
      onClose: () => void;
      onLoad?: () => void;
    });
    setup(): void;
    open(): void;
    close(): void;
  }
}
