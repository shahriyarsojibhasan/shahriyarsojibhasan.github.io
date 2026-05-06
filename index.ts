export default function CyberpunkPortfolio() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#7f5af033,transparent_30%),radial-gradient(circle_at_bottom_left,#f75c7e22,transparent_30%)]"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/10 bg-[#0d1117cc]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-widest text-[#F75C7E]">
            SHAHRIYAR
          </h1>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <a href="#about" className="hover:text-[#F75C7E] transition">About</a>
            <a href="#stack" className="hover:text-[#F75C7E] transition">Stack</a>
            <a href="#workspace" className="hover:text-[#F75C7E] transition">Workspace</a>
            <a href="#contact" className="hover:text-[#F75C7E] transition">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F75C7E]/30 bg-[#ffffff08] mb-6">
            <div className="w-2 h-2 rounded-full bg-[#F75C7E] animate-pulse"></div>
            <span className="text-sm text-gray-300">Available for creative projects</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            Building <span className="text-[#F75C7E]">Future</span>
            <br />
            Through Code.
          </h1>

          <p className="mt-8 text-lg text-gray-400 leading-8 max-w-xl">
            I am Shahriyar Sojib Hasan. A full-stack developer, hacker, Linux enthusiast, and futuristic UI designer focused on creating premium digital experiences with modern technologies.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="https://github.com/shahriyarsojibhasan"
              className="px-7 py-4 rounded-2xl bg-[#F75C7E] text-black font-semibold hover:scale-105 transition"
            >
              GitHub
            </a>

            <a
              href="https://x.com/shahriyarsojib_"
              className="px-7 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Connect
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-[#7F5AF0]/20 rounded-full"></div>

          <div className="relative bg-white/5 border border-white/10 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs text-gray-400">terminal.sh</span>
            </div>

            <pre className="text-sm md:text-base text-gray-300 leading-8 overflow-x-auto">
{`┌──(shahriyar㉿cyberdeck)-[~/workspace]
└─$ whoami

> Full-Stack Developer
> Linux Power User
> UI/UX Explorer
> Open Source Enthusiast

┌──(shahriyar㉿cyberdeck)-[~/workspace]
└─$ sudo deploy future

████████████████████ 100%
Deployment successful 🚀`}
            </pre>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-white/5 border border-white/10 rounded-[30px] p-10 backdrop-blur-xl">
            <p className="text-[#F75C7E] font-semibold mb-4">ABOUT ME</p>
            <h2 className="text-4xl font-black mb-6">Cyberpunk Mindset.</h2>

            <p className="text-gray-400 leading-8 text-lg">
              Passionate about modern web applications, terminal customization, futuristic interfaces, open source development, and creating immersive user experiences.
            </p>

            <div className="grid grid-cols-2 gap-5 mt-10">
              <div className="bg-black/30 rounded-2xl p-5 border border-white/10">
                <p className="text-gray-500 text-sm">Birthday</p>
                <h3 className="text-xl font-bold mt-2">29 May</h3>
              </div>

              <div className="bg-black/30 rounded-2xl p-5 border border-white/10">
                <p className="text-gray-500 text-sm">Based In</p>
                <h3 className="text-xl font-bold mt-2">Bangladesh</h3>
              </div>

              <div className="bg-black/30 rounded-2xl p-5 border border-white/10">
                <p className="text-gray-500 text-sm">Favorite OS</p>
                <h3 className="text-xl font-bold mt-2">Kali Linux</h3>
              </div>

              <div className="bg-black/30 rounded-2xl p-5 border border-white/10">
                <p className="text-gray-500 text-sm">Dream</p>
                <h3 className="text-xl font-bold mt-2">Travel World 🌍</h3>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#7F5AF0]/20 to-[#F75C7E]/20 rounded-[30px] border border-white/10 p-10">
            <p className="text-[#F75C7E] font-semibold mb-4">LIFESTYLE</p>

            <div className="space-y-5 mt-8">
              {[
                'Coffee addicted ☕',
                'Late night coding 🌙',
                'Music while programming 🎧',
                'Terminal customization ⚡',
                'Minimal futuristic design 🌌',
                'Exploring new technologies 🚀'
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-black/30 border border-white/10 rounded-2xl p-5"
                >
                  <div className="w-3 h-3 rounded-full bg-[#F75C7E]"></div>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[#F75C7E] font-semibold">TECH STACK</p>
          <h2 className="text-5xl font-black mt-3">Technologies I Use</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {[
            'JavaScript',
            'TypeScript',
            'Python',
            'Rust',
            'React',
            'Next.js',
            'Node.js',
            'Docker',
            'Kubernetes',
            'MongoDB',
            'PostgreSQL',
            'Redis',
            'Linux',
            'GitHub Actions',
            'Android Studio'
          ].map((tech, index) => (
            <div
              key={index}
              className="group bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-[#F75C7E]/40 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-xl font-bold text-center group-hover:text-[#F75C7E] transition">
                {tech}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workspace */}
      <section id="workspace" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[#F75C7E] font-semibold">DIGITAL WORKSPACE</p>
          <h2 className="text-5xl font-black mt-3">My Setup</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Operating System',
              content: 'Windows 10\nKali Linux\nWSL2'
            },
            {
              title: 'Editors',
              content: 'VS Code\nAndroid Studio\nNeovim'
            },
            {
              title: 'Terminal',
              content: 'Windows Terminal\nPowerShell\nBash + ZSH'
            },
            {
              title: 'Environment',
              content: 'Coffee ☕\nMusic 🎧\nCyberpunk UI 🌌'
            }
          ].map((card, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-[30px] p-8 hover:border-[#F75C7E]/40 transition"
            >
              <h3 className="text-2xl font-black mb-6 text-[#F75C7E]">
                {card.title}
              </h3>

              <pre className="text-gray-300 leading-8 whitespace-pre-wrap">
{card.content}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-r from-[#7F5AF0]/20 to-[#F75C7E]/20 border border-white/10 rounded-[40px] p-14">
          <h2 className="text-4xl md:text-5xl font-black leading-tight">
            Design systems that feel alive.
          </h2>

          <p className="mt-8 text-gray-400 text-lg leading-8 max-w-3xl mx-auto">
            I believe technology should not only function perfectly but also create unforgettable emotional experiences through modern interfaces and meaningful design.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="border-t border-white/10 bg-black/20 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <h2 className="text-3xl font-black text-[#F75C7E]">
                Shahriyar Sojib Hasan
              </h2>

              <p className="text-gray-400 mt-4 max-w-xl leading-8">
                Full-stack developer building futuristic digital experiences with clean architecture, premium UI/UX, and cyberpunk aesthetics.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              {[
                ['GitHub', 'https://github.com/shahriyarsojibhasan'],
                ['X', 'https://x.com/shahriyarsojib_'],
                ['Instagram', 'https://instagram.com/shahriyarsojibhasan'],
                ['BuyMeACoffee', 'https://buymeacoffee.com/shahriyarsojibhasan']
              ].map(([name, link], index) => (
                <a
                  key={index}
                  href={link}
                  className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-[#F75C7E] hover:text-black transition"
                >
                  {name}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-14 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
            © 2026 Shahriyar Sojib Hasan • Dreaming beyond borders 🌍
          </div>
        </div>
      </footer>
    </div>
  )
}
