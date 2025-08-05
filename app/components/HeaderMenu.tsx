
import { Button, Menu } from 'react-native-paper';
import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HeaderMenu = () => {
    const [visible, setVisible] = useState(false);

    return (
        <Menu
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentStyle={{ backgroundColor: '#FFF4EE', borderRadius: 12 }} // full menu style
            anchor={
                <TouchableOpacity onPress={() => setVisible(true)} className="flex-row items-center p-2">
                    <Ionicons name="ellipsis-horizontal-outline" size={24} color="#EB5A10" />
                </TouchableOpacity>
            }
        >
            <Menu.Item
                onPress={() => { }}
                title="Item 1"
                titleStyle={{ color: '#EB5A10' }}
                style={{ backgroundColor: '#FFF4EE' }}
            />
            <Menu.Item
                onPress={() => { }}
                title="Item 2"
                titleStyle={{ color: '#EB5A10' }}
                style={{ backgroundColor: '#FFF4EE' }}
            />
            <Menu.Item
                onPress={() => { }}
                title="Item 3"
                titleStyle={{ color: '#EB5A10' }}
                style={{ backgroundColor: '#FFF4EE' }}
            />
        </Menu>
    );
}


export default HeaderMenu;