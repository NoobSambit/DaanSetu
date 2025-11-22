import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero Section */}
      <section className="gradient-primary section relative overflow-hidden">
        <div className="container-custom text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 animate-fade-in">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">DaanSetu</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Discover and connect with NGOs across India. Find organizations working in education, health, food security, women empowerment, and animal welfare.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-bottom" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/ngos"
              className="btn btn-primary px-8 py-3.5 text-lg shadow-lg hover:shadow-xl"
            >
              Explore NGOs
            </Link>
            <Link
              href="/map"
              className="btn btn-secondary px-8 py-3.5 text-lg border-2"
            >
              View Map
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
      </section>

      {/* Features Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-16">
            How DaanSetu Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
                title: 'Discover',
                description: 'Search and filter NGOs by category, location, and cause',
                color: 'blue'
              },
              {
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
                title: 'Explore',
                description: 'View NGO profiles and their work in communities',
                color: 'green'
              },
              {
                icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>,
                title: 'Connect',
                description: 'Find NGOs near you on our interactive map',
                color: 'purple'
              }
            ].map((feature, index) => (
              <div key={feature.title} className="text-center group" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`bg-${feature.color}-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <svg className={`w-10 h-10 text-${feature.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section bg-slate-50">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-16">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {[
              { name: 'Education', emoji: '📚', color: 'blue' },
              { name: 'Food', emoji: '🍲', color: 'green' },
              { name: 'Health', emoji: '🏥', color: 'red' },
              { name: 'Women', emoji: '👩', color: 'purple' },
              { name: 'Animals', emoji: '🐾', color: 'orange' },
            ].map((category, index) => (
              <Link
                key={category.name}
                href={`/ngos?category=${category.name.toLowerCase()}`}
                className="card p-6 md:p-8 text-center hover-lift group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">{category.emoji}</div>
                <div className="font-bold text-slate-900 text-lg">{category.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="card-elevated p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Are you an NGO?
            </h2>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              Join our platform to increase your visibility and connect with supporters
            </p>
            <Link
              href="/auth/signup"
              className="btn btn-primary px-8 py-3.5 text-lg shadow-lg hover:shadow-xl inline-block"
            >
              Register Your NGO
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
