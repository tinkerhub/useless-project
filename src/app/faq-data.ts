// Plain data, deliberately kept out of faq-section.tsx: that file is "use client", and a server
// component (page.tsx, for the FAQPage JSON-LD) importing a named export from a client-boundary
// module resolves to an opaque client reference rather than the real array - .map() on it throws
// at runtime under Turbopack. Living in its own non-client module lets both sides import the same
// real data.
export const FAQ_ITEMS = [
  {
    tag: "(Q1)",
    question: "What is Useless Projects?",
    answer:
      "Useless Projects is TinkerHub's signature 18-hour overnight make-a-thon, where the only rule is that your project has to be delightfully useless. No pitch decks, no \"real-world impact\" talk, just a night dedicated to building whatever wonderfully pointless idea comes to mind.",
  },
  {
    tag: "(Q2)",
    question: 'Why "useless"?',
    answer:
      "Honestly, because it takes the pressure off. When you're not chasing a business case or a scalable solution, you're free to build purely for curiosity, humor, and the joy of making something just because you can. Some of the most technically impressive projects come out of this freedom.",
  },
  {
    tag: "(Q3)",
    question: "Who can participate?",
    answer:
      "Any student from a TinkerHub Campus Community can take part, regardless of your branch, year, or experience level. You don't need to be from a tech background. Designers, artists, writers, and anyone curious to build something is welcome.",
  },
  {
    tag: "(Q4)",
    question: "Do I need a team, or can I participate solo?",
    answer:
      "You can take part solo or in a team. The team size for Useless Projects is a maximum of 2.",
  },
  {
    tag: "(Q5)",
    question: "Do I need coding experience?",
    answer:
      "No. Useless Projects welcomes all skill levels and all disciplines, hardware, software, design, or anything else you can dream up. If you're new, it's actually one of the best low-pressure ways to start building.",
  },
  {
    tag: "(Q6)",
    question: "What can I build?",
    answer:
      "Anything, as long as it's not meant to solve a \"real\" problem. Software, hardware, a mix of both, or something entirely unexpected.",
  },
  {
    tag: "(Q7)",
    question: "Do I need to bring my own hardware/components?",
    answer:
      "Yes, you will have to bring your own hardware components unless otherwise specified by your venue.",
  },
  {
    tag: "(Q8)",
    question: "How long does the event run?",
    answer:
      "It's an 18-hour overnight build, from evening to the next morning. Exact timing depends on your campus, check your local campus lead for the specific schedule.",
  },
  {
    tag: "(Q9)",
    question: "Is there a cost to participate?",
    answer:
      "All TinkerHub events and initiatives are free of cost.",
  },
  {
    tag: "(Q10)",
    question: "What do I need to bring?",
    answer:
      "Your laptop (if working on software), any hardware components you're using, a charger, and enough energy to stay up building through the night.",
  },
  {
    tag: "(Q11)",
    question: "How are projects judged?",
    answer:
      "Projects are judged on creativity, execution, and how delightfully useless (yet well-built) they are.",
  },
  {
    tag: "(Q12)",
    question: "Are there prizes?",
    answer:
      "Top 25 makers get a 6 month fellowship worth up-to 5 lakh rupees.\nTop 50 projects will be showcased in Maker Faire, Kerala.",
  },
  {
    tag: "(Q13)",
    question: "Do I need to submit my project afterward?",
    answer:
      "Yes, all teams are expected to submit their project (even an incomplete one counts) before the event ends. This helps us document and celebrate the builds.",
  },
  {
    tag: "(Q14)",
    question: "Can I see past projects?",
    answer:
      "Yes, check out projects from previous editions [link to project gallery/site] for inspiration, past builds have ranged from AI-powered ant traffic controllers to a Malayalam programming language.",
  },
  {
    tag: "(Q15)",
    question: "How do I register?",
    answer:
      "Registration is done through the TinkerHub App. Reach out to your campus's TinkerHub chapter for the event details.",
  },
  {
    tag: "(Q16)",
    question: "I don't see Useless Projects happening at my campus. What do I do?",
    answer:
      "Currently, Useless Projects runs as a campus-exclusive program, meaning it's organized through active TinkerHub Campus Communities. If your campus doesn't have one yet, that's the first step. If you'd like to start a TinkerHub Campus Community at your campus, check out https://tinkerhub.org/",
  },
];
