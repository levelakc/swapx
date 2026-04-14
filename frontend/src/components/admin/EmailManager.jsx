import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { sendAdminEmail, getAllUsers } from '../../api/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Loader2, Send, Mail, User, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailManager() {
  const { t } = useLanguage();
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: getAllUsers,
  });

  const emailMutation = useMutation({
    mutationFn: sendAdminEmail,
    onSuccess: () => {
      toast.success(t('emailSentSuccess', 'Email sent successfully!'));
      setSubject('');
      setMessage('');
    },
    onError: (error) => {
      toast.error(error.message || t('emailSentError', 'Failed to send email'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!recipient || !subject || !message) {
      toast.error(t('fillAllFields', 'Please fill all fields'));
      return;
    }
    emailMutation.mutate({ to: recipient, subject, message });
  };

  return (
    <div className="space-y-8">
      <div className="bg-card rounded-3xl p-8 border border-white/10 shadow-xl">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
          <Mail className="text-primary" />
          {t('sendEmailToUser', 'Send Email to User')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
              {t('recipient', 'Recipient')}
            </label>
            <div className="relative">
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-secondary/30 rounded-2xl p-4 pl-12 focus:outline-none focus:ring-2 focus:ring-primary border-transparent text-foreground appearance-none"
                required
              >
                <option value="">{t('selectUser', 'Select a user...')}</option>
                {users.map((u) => (
                  <option key={u._id} value={u.email}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
              {t('subject', 'Subject')}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('emailSubjectPlaceholder', 'Enter email subject...')}
              className="w-full bg-secondary/30 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary border-transparent text-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
              {t('message', 'Message')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('emailMessagePlaceholder', 'Write your message here...')}
              className="w-full bg-secondary/30 rounded-2xl p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-primary border-transparent text-foreground resize-none"
              required
            />
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-start gap-3">
            <Info size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('emailNotice', 'This email will be sent from AHLAFOT Admin Support. The user will see it in their inbox.')}
            </p>
          </div>

          <button
            type="submit"
            disabled={emailMutation.isLoading}
            className="w-full bg-primary text-primary-content font-black py-4 rounded-2xl hover:shadow-2xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-3 text-lg active:scale-95 disabled:opacity-50"
          >
            {emailMutation.isLoading ? <Loader2 className="animate-spin" /> : <Send size={22} />}
            {t('sendEmail', 'Send Email')}
          </button>
        </form>
      </div>
    </div>
  );
}
