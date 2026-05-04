import { useState } from 'react';
import { Input } from '@cn/components/ui/input';
import { Textarea } from '@cn/components/ui/textarea';
import { Button } from '@cn/components/ui/button';
import { cn } from '@cn/lib/utils';
import loopar from "loopar";

const sizeClasses = {
  compact: {
    container: "space-y-2",
    grid: "gap-2",
    title: "text-lg font-semibold mb-3",
    input: "h-8 text-sm",
    textarea: "text-sm",
    button: "h-8 text-sm"
  },
  normal: {
    container: "space-y-4",
    grid: "gap-4",
    title: "text-2xl font-bold mb-6",
    input: "h-10",
    textarea: "",
    button: "h-10"
  },
  large: {
    container: "space-y-6",
    grid: "gap-6",
    title: "text-3xl font-bold mb-8",
    input: "h-12 text-lg",
    textarea: "text-lg",
    button: "h-12 text-lg"
  }
};

export default function ContactForm(props) {
  const { 
    data: {
      label = 'Contact Us',
      show_phone = true,
      show_subject = true,
      button_text = 'Send Message',
      success_message = 'Message sent successfully!',
      variant = 'default',
      size = 'normal',
      name_placeholder = 'Name *',
      email_placeholder = 'Email *',
      phone_placeholder = 'Phone',
      subject_placeholder = 'Subject *',
      message_placeholder = 'Message *',
      rows = 5,
      show_reset_button = 0,
      reset_button_text = 'Send another message'
    } 
  } = props;

  const [form, setForm] = useState({
    sender_name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const styles = sizeClasses[size] || sizeClasses.normal;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    loopar.api.post("Contact Message", "submit", {
      body: {
        ...form,
        source_page: window.location.pathname
      },
      success: () => {
        setSent(true);
        setForm({ sender_name: '', email: '', phone: '', subject: '', message: '' });
      },
      always: () => {
        setLoading(false);
      }
    });
  };

  const handleReset = () => {
    setSent(false);
    setForm({ sender_name: '', email: '', phone: '', subject: '', message: '' });
  };

  if (sent) {
    return (
      <div className="text-center p-8">
        <div className="text-4xl mb-4">✉️</div>
        <h3 className={cn("font-semibold mb-4", styles.title)}>{success_message}</h3>
        <Button variant="outline" onClick={handleReset} className={styles.button}>
          {reset_button_text}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && <h2 className={styles.title}>{label}</h2>}
      
      <form onSubmit={handleSubmit} className={styles.container}>
        <div className={cn("grid grid-cols-1 md:grid-cols-2", styles.grid)}>
          <Input
            name="sender_name"
            placeholder={name_placeholder}
            value={form.sender_name}
            onChange={handleChange}
            required
            className={styles.input}
          />
          <Input
            name="email"
            type="email"
            placeholder={email_placeholder}
            value={form.email}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        {(show_phone || show_subject) && (
          <div className={cn("grid grid-cols-1 md:grid-cols-2", styles.grid)}>
            {show_phone && (
              <Input
                name="phone"
                placeholder={phone_placeholder}
                value={form.phone}
                onChange={handleChange}
                className={styles.input}
              />
            )}
            {show_subject && (
              <Input
                name="subject"
                placeholder={subject_placeholder}
                value={form.subject}
                onChange={handleChange}
                required
                className={styles.input}
              />
            )}
          </div>
        )}

        <Textarea
          name="message"
          placeholder={message_placeholder}
          value={form.message}
          onChange={handleChange}
          rows={rows}
          required
          className={cn("w-full", styles.textarea)}
        />

        <Button 
          type="submit" 
          variant={variant}
          disabled={loading} 
          className={cn("w-full", styles.button)}
        >
          {loading ? 'Sending...' : button_text}
        </Button>
      </form>
    </div>
  );
}

ContactForm.metaFields = () => {
  return [
    {
      group: "content",
      elements: {
        label: {
          element: INPUT,
          data: {
            label: "Title",
            description: "Form title displayed above the fields",
            default: "Contact Us"
          }
        },
        success_message: {
          element: INPUT,
          data: {
            label: "Success Message",
            description: "Message shown after successful submission",
            default: "Message sent successfully!"
          }
        },
        button_text: {
          element: INPUT,
          data: {
            label: "Button Text",
            default: "Send Message"
          }
        },
        show_reset_button: {
          element: SWITCH,
          data: {
            label: "Show Reset Button",
            description: "Show button to send another message after success",
            default: 1
          }
        },
        reset_button_text: {
          element: INPUT,
          data: {
            label: "Reset Button Text",
            default: "Send another message"
          }
        }
      }
    },
    {
      group: "fields",
      elements: {
        show_phone: {
          element: SWITCH,
          data: {
            label: "Show Phone Field",
            default: 1
          }
        },
        show_subject: {
          element: SWITCH,
          data: {
            label: "Show Subject Field",
            default: 1
          }
        },
        rows: {
          element: INPUT,
          data: {
            label: "Message Rows",
            description: "Number of rows for the message textarea",
            type: "number",
            default: 5
          }
        }
      }
    },
    {
      group: "placeholders",
      elements: {
        name_placeholder: {
          element: INPUT,
          data: {
            label: "Name Placeholder",
            default: "Name *"
          }
        },
        email_placeholder: {
          element: INPUT,
          data: {
            label: "Email Placeholder",
            default: "Email *"
          }
        },
        phone_placeholder: {
          element: INPUT,
          data: {
            label: "Phone Placeholder",
            default: "Phone"
          }
        },
        subject_placeholder: {
          element: INPUT,
          data: {
            label: "Subject Placeholder",
            default: "Subject *"
          }
        },
        message_placeholder: {
          element: TEXTAREA,
          data: {
            label: "Message Placeholder",
            default: "Message *"
          }
        }
      }
    },
    {
      group: "style",
      elements: {
        variant: {
          element: SELECT,
          data: {
            label: "Button Style",
            options: [
              { option: "Default", value: "default" },
              { option: "Primary", value: "primary" },
              { option: "Secondary", value: "secondary" },
              { option: "Outline", value: "outline" },
              { option: "Ghost", value: "ghost" },
              { option: "Destructive", value: "destructive" }
            ],
            default: "default"
          }
        },
        size: {
          element: SELECT,
          data: {
            label: "Form Size",
            options: [
              { option: "Compact", value: "compact" },
              { option: "Normal", value: "normal" },
              { option: "Large", value: "large" }
            ],
            default: "normal"
          }
        }
      }
    }
  ];
};