/**
 * Types for Companion Emails System
 */

export interface CompanionEmail {
  id: string;
  email: string;
  confirmed: boolean;
  confirmationSent: Date;
  confirmationToken: string;
  settings: {
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean; // sempre true, não pode ser desabilitado
  };
}

export interface CompanionEmailsState {
  emails: CompanionEmail[];
  newEmail: string;
  isAddingEmail: boolean;
  confirmationCodes: {[emailId: string]: string};
}

export interface CompanionEmailsActions {
  setEmails: (emails: CompanionEmail[]) => void;
  setNewEmail: (email: string) => void;
  setIsAddingEmail: (adding: boolean) => void;
  setConfirmationCodes: (codes: {[emailId: string]: string}) => void;
  updateConfirmationCode: (emailId: string, code: string) => void;
  addEmail: () => Promise<void>;
  removeEmail: (emailId: string) => Promise<void>;
  confirmEmail: (emailId: string) => Promise<void>;
  resendConfirmation: (email: CompanionEmail) => Promise<void>;
  updateEmailSettings: (emailId: string, setting: keyof CompanionEmail['settings'], value: boolean) => Promise<void>;
}