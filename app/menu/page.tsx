'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Coffee, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { MenuCard } from './_components/MenuCard';
import { Cart } from './_components/Cart';
import { CheckoutModal } from './_components/CheckoutModal';
import { CustomerOrderItem, CustomerOrder } from '@/app/types/order.type';
import { useSocket } from '../providers/socket-provider';

interface MenuItem {
    _id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    category?: string;
    menuType?: 'food' | 'drink';
    ingredients: Array<{ name: string; quantity: string; unit: string }>;
    available: boolean;
}

interface CategoryData {
    _id: string;
    name: string;
    menuType: 'food' | 'drink';
    products: MenuItem[];
}

export default function MenuPage() {
    const { emitCustomerOrder } = useSocket();

    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMenuType, setSelectedMenuType] = useState<'all' | 'food' | 'drink'>('all');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState<CustomerOrderItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);

    // Fetch products
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/categories`);
                const data: CategoryData[] = await res.json();
                setCategories(data);
            } catch {
                toast.error('Failed to load menu');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMenu();
    }, []);

    // Flatten products
    const allProducts = useMemo(() =>
        categories.flatMap(cat =>
            (cat.products ?? [])
                .filter(p => p.available)
                .map(p => ({ ...p, category: cat.name, menuType: cat.menuType }))
        ),
        [categories]
    );

    // Category tabs
    const categoryTabs = useMemo(() => [
        'All',
        ...Array.from(new Set(
            allProducts
                .filter(p => selectedMenuType === 'all' || p.menuType === selectedMenuType)
                .map(p => p.category ?? 'Other')
        ))
    ], [allProducts, selectedMenuType]);

    // Filtered products
    const filteredProducts = useMemo(() =>
        allProducts.filter(p =>
            (selectedMenuType === 'all' || p.menuType === selectedMenuType) &&
            (selectedCategory === 'All' || p.category === selectedCategory)
        ),
        [allProducts, selectedMenuType, selectedCategory]
    );

    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
    const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Cart actions
    const addToCart = (product: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === product._id);
            if (existing) {
                return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...product, quantity: 1, ingredients: product.ingredients ?? [] }];
        });
        toast.success(`${product.name} added to cart`);
    };

    const updateCart = (id: string, change: number) => {
        setCart(prev =>
            prev
                .map(i => i._id === id ? { ...i, quantity: Math.max(1, i.quantity + change) } : i)
                .filter(i => i.quantity > 0)
        );
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i._id !== id));
    };

    const handleConfirmOrder = async (order: CustomerOrder) => {
        emitCustomerOrder(order);
        setCart([]);
        setShowCheckout(false);
        setShowCart(false);
        toast.success('Order placed!', {
            description: 'The cashier will process your order shortly.',
            duration: 5000,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-white font-black text-2xl uppercase tracking-widest">
                            RENDEZVOUS<span className="text-primary">.</span>
                        </h1>
                        <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">Our Menu</p>
                    </div>

                    {/* Cart button */}
                    <button
                        onClick={() => setShowCart(true)}
                        className="relative flex items-center gap-3 bg-primary text-background px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white active:scale-95 transition-all duration-200 shadow-lg shadow-primary/30"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Cart</span>
                        {cartCount > 0 && (
                            <>
                                <span className="font-black">·</span>
                                <span>₱{cartTotal.toFixed(0)}</span>
                                <span className="absolute -top-2 -right-2 h-5 w-5 bg-background text-primary text-xs rounded-full flex items-center justify-center font-black border-2 border-primary">
                                    {cartCount}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Menu type filter */}
                <div className="flex gap-3 mb-6">
                    {(['all', 'food', 'drink'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => { setSelectedMenuType(type); setSelectedCategory('All'); }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all duration-200 ${selectedMenuType === type
                                ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20'
                                : 'bg-transparent text-white/60 border-white/20 hover:border-white/40 hover:text-white'
                                }`}
                        >
                            {type === 'food' && <Utensils className="w-3.5 h-3.5" />}
                            {type === 'drink' && <Coffee className="w-3.5 h-3.5" />}
                            {type === 'all' ? 'All Items' : type === 'food' ? 'Food' : 'Drinks'}
                        </button>
                    ))}
                </div>

                {/* Category tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
                    {categoryTabs.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all duration-200 shrink-0 ${selectedCategory === cat
                                ? 'bg-white/15 text-white border-white/30'
                                : 'bg-transparent text-white/40 border-white/10 hover:text-white/70 hover:border-white/20'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-64" />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-24 text-white/30">
                        <div className="text-6xl mb-4">🍃</div>
                        <p className="font-black uppercase tracking-widest text-sm">No items found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(product => (
                            <MenuCard key={product._id} product={product} onAdd={addToCart} />
                        ))}
                    </div>
                )}
            </div>

            {/* Cart drawer */}
            {showCart && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
                    <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-white/10 flex flex-col shadow-2xl">
                        <Cart
                            items={cart}
                            onUpdate={updateCart}
                            onRemove={removeFromCart}
                            onClose={() => setShowCart(false)}
                            onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
                        />
                    </div>
                </div>
            )}

            {/* Desktop cart sidebar */}
            {showCart && (
                <div className="hidden lg:block fixed right-6 top-24 z-40 w-96">
                    <div className="bg-background border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <Cart
                            items={cart}
                            onUpdate={updateCart}
                            onRemove={removeFromCart}
                            onClose={() => setShowCart(false)}
                            onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
                        />
                    </div>
                </div>
            )}

            {/* Checkout modal */}
            {showCheckout && (
                <CheckoutModal
                    items={cart}
                    total={cartTotal}
                    onClose={() => setShowCheckout(false)}
                    onConfirm={handleConfirmOrder}
                />
            )}
        </div>
    );
}