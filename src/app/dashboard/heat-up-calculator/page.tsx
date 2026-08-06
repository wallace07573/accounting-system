"use client";

import React, { useState } from 'react';

const products = [
    { id: 1, name: "PKM TCG 30th Celebration Binder Collection", prices: [990, 1260, 1290, 1500] },
    { id: 2, name: "PKM TCG 30th Celebration Tech Sticker Collection", prices: [1068, 1380, 1440, 1560] },
    { id: 3, name: "PKM TCG 30th Celebration Tech Poster Collection", prices: [630, 690, 720, 780] },
    { id: 4, name: "PKM TCG 30th Celebration 2-Pack Blister", prices: [708, 900, 960, 1080] },
    { id: 5, name: "PKM TCG 30th Celebration Knock Out Collection", prices: [1416, 1800, 1920, 2160] },
    { id: 6, name: "PKM TCG 30th Celebration EX BOX", prices: [630, 900, 930, 990] },
    { id: 7, name: "PKM TCG 30th Celebration EX Tin [Assortment]", prices: [810, 990, 1020, 1140] },
    { id: 8, name: "PKM TCG 30th Celebration ETB", prices: [2400, 3200, 3300, 3500, 3600, 3800] },
    { id: 9, name: "PKM TCG 30th Celebration Ex Tin", prices: [630, 870, 900, 960], release: "Oct 26" }
];

export default function HeatUpCalculator() {
    const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
    const [selectedPrice, setSelectedPrice] = useState<number | ''>('');
    const [selectedPercentage, setSelectedPercentage] = useState<number>(0);

    const selectedProduct = products.find(p => p.id === selectedProductId);

    const finalAmount = selectedPrice !== '' ? (selectedPrice * selectedPercentage).toFixed(2) : "0.00";
    const showResult = selectedPrice !== '';

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '20px',
                padding: '2.5rem',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: '#f8fafc'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        Heat Up Calculator
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        Calculate your target prices for the collection series
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#cbd5e1' }}>
                        Select Product
                    </label>
                    <select 
                        value={selectedProductId}
                        onChange={(e) => {
                            setSelectedProductId(Number(e.target.value));
                            setSelectedPrice('');
                        }}
                        style={{
                            width: '100%', padding: '1rem', backgroundColor: '#0f172a',
                            border: '1px solid #334155', borderRadius: '10px',
                            color: '#f8fafc', fontSize: '1rem', outline: 'none',
                            appearance: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="" disabled>Choose a product...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.release ? ` (Release: ${p.release})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#cbd5e1' }}>
                        Select Target Price
                    </label>
                    <select 
                        value={selectedPrice}
                        onChange={(e) => setSelectedPrice(Number(e.target.value))}
                        disabled={!selectedProduct}
                        style={{
                            width: '100%', padding: '1rem', backgroundColor: '#0f172a',
                            border: `1px solid ${!selectedProduct ? '#1e293b' : '#334155'}`, 
                            borderRadius: '10px', color: '#f8fafc', fontSize: '1rem', 
                            outline: 'none', appearance: 'none',
                            cursor: !selectedProduct ? 'not-allowed' : 'pointer',
                            opacity: !selectedProduct ? 0.5 : 1
                        }}
                    >
                        <option value="" disabled>
                            {!selectedProduct ? "Choose a product first..." : "Choose a price..."}
                        </option>
                        {selectedProduct && selectedProduct.prices.map(price => (
                            <option key={price} value={price}>RM {price}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#cbd5e1' }}>
                        Select Percentage
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        {[
                            { label: '0%', value: 0 },
                            { label: '5%', value: 0.05 },
                            { label: '10%', value: 0.10 },
                            { label: '15%', value: 0.15 }
                        ].map((pct) => (
                            <button
                                key={pct.value}
                                onClick={() => setSelectedPercentage(pct.value)}
                                style={{
                                    backgroundColor: selectedPercentage === pct.value ? '#6366f1' : '#0f172a',
                                    border: `1px solid ${selectedPercentage === pct.value ? '#6366f1' : '#334155'}`,
                                    color: selectedPercentage === pct.value ? 'white' : '#94a3b8',
                                    padding: '1rem', borderRadius: '10px', fontSize: '1rem',
                                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
                                    boxShadow: selectedPercentage === pct.value ? '0 4px 14px 0 rgba(99, 102, 241, 0.39)' : 'none'
                                }}
                            >
                                {pct.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: showResult ? 1 : 0,
                    transform: showResult ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    <div>
                        <div style={{ color: '#10b981', fontWeight: 600, fontSize: '1.1rem' }}>Final Amount</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            {selectedPrice !== '' ? `RM ${selectedPrice} × ${selectedPercentage * 100}%` : 'RM 0.00 × 0%'}
                        </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981', textShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                        RM {finalAmount}
                    </div>
                </div>
            </div>
        </div>
    );
}
