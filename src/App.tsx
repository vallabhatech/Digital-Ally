import React, { useState } from 'react';

const DigitalAllyApp: React.FC = () => {
  const [formData, setFormData] = useState({
    userName: '',
    businessName: '',
    userEmail: '',
    userPhone: '',
    description: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    alert('Generate button clicked! Form data: ' + JSON.stringify(formData, null, 2));
  };

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      backgroundColor: '#ECFAE5',
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(rgba(176, 219, 156, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(176, 219, 156, 0.3) 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}>
        <h1 style={{ fontSize: '3.5rem', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>Build Your Website in Minutes</h1>
        <p style={{ fontSize: '1.3rem', color: '#666', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>AI-powered website generation for your business. Transform your ideas into a professional website instantly.</p>
        
        <div style={{ backgroundColor: 'rgba(248, 249, 250, 0.9)', padding: '40px', borderRadius: '12px', textAlign: 'left', border: '1px solid rgba(200, 200, 200, 0.3)' }}>
          {/* Step 1: Business Details */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📋 Business Details
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Tell us about yourself and your business</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Your Name" 
                value={formData.userName}
                onChange={(e) => handleInputChange('userName', e.target.value)}
                style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', backgroundColor: 'rgba(255, 255, 255, 0.8)' }} 
              />
              <input 
                type="text" 
                placeholder="Business Name" 
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', backgroundColor: 'rgba(255, 255, 255, 0.8)' }} 
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={formData.userEmail}
                onChange={(e) => handleInputChange('userEmail', e.target.value)}
                style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', backgroundColor: 'rgba(255, 255, 255, 0.8)' }} 
              />
              <input 
                type="tel" 
                placeholder="Phone Number" 
                value={formData.userPhone}
                onChange={(e) => handleInputChange('userPhone', e.target.value)}
                style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px', backgroundColor: 'rgba(255, 255, 255, 0.8)' }} 
              />
            </div>
          </div>
          
          {/* Step 2: Business Description */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📝 Business Description
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Describe what your business does and what makes it special</p>
            <textarea 
              placeholder="Tell us about your business - your products, services, target audience, and what makes you unique..." 
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              style={{ 
                width: '100%', 
                height: '150px', 
                padding: '15px', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                resize: 'vertical', 
                fontSize: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                fontFamily: 'inherit'
              }} 
            />
          </div>
          
          {/* Color Palette Preview */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#333', marginBottom: '15px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🎨 Choose Your Style
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Select a color palette that matches your brand</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
              {['Modern', 'Vibrant', 'Corporate', 'Elegant'].map((style) => (
                <div key={style} style={{ 
                  padding: '15px', 
                  border: '2px solid #ddd', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: '#6366f1', borderRadius: '50%', margin: '0 2px' }}></div>
                    <div style={{ width: '20px', height: '20px', backgroundColor: '#8b5cf6', borderRadius: '50%', margin: '0 2px' }}></div>
                    <div style={{ width: '20px', height: '20px', backgroundColor: '#ec4899', borderRadius: '50%', margin: '0 2px' }}></div>
                  </div>
                  <h3 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{style}</h3>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={handleGenerate}
            style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '18px 50px', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'block',
              margin: '30px auto 0 auto',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            ✨ Generate My Website
          </button>
        </div>
        
        <div style={{ marginTop: '30px', textAlign: 'center', color: '#666' }}>
          <p>🚀 Join thousands of businesses using AI to create amazing websites</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return <DigitalAllyApp />;
};

export default App;
